import { MS_HOUR, MS_MIN, numEnv } from './utils.js';
import { getSettings, logEvent, patchSchedulerHealth, recordActuatorCommand, recordSettingChange, VALID_ANCHORS } from './db.js';
import { calculateSchedule, bestEffortEnsureAstronomy } from './astronomy.js';

async function noteEvaluation(env,source,mode,desired,result){
  await patchSchedulerHealth(env,{last_evaluation_at:Date.now(),last_evaluation_source:source,last_evaluation_mode:mode,last_evaluation_desired:desired??null,last_evaluation_action:result?.action??'none'});
}

export async function controllerTick(env,{source='unknown',force=false}={}){
  let s=await getSettings(env);const now=Date.now();
  if(s.test_active){
    let desired,eventKey;
    if(now<s.test_on_at){desired='OFF';eventKey=`TEST:PRE-ON:${s.test_on_at}`;}
    else if(now<s.test_off_at){desired='ON';eventKey=`TEST:ON:${s.test_on_at}`;}
    else{desired='OFF';eventKey=`TEST:OFF:${s.test_off_at}`;}
    const result=await enforceDesired(env,s,desired,eventKey,source,force);
    const fresh=await getSettings(env);
    if(now>=fresh.test_off_at&&fresh.last_commanded_state==='OFF'&&!fresh.confirm_state){
      await env.DB.prepare(`UPDATE settings SET test_active=0,test_on_at=NULL,test_off_at=NULL,auto_enabled=0,updated_at=? WHERE id=1`).bind(Date.now()).run();
      await logEvent(env,'INFO','TEST_FINISHED','Commissioning test ended OFF after confirmation; AUTO remains paused');
    }
    await noteEvaluation(env,source,'TEST',desired,result);
    return {mode:'TEST',desired,...result};
  }

  if(!s.auto_enabled){const result={action:'none'};await noteEvaluation(env,source,'PAUSED',null,result);return {mode:'PAUSED',...result};}

  const schedule=await calculateSchedule(env,s,now);
  if(s.override_state&&(!s.override_until||now>=s.override_until)){
    await env.DB.prepare(`UPDATE settings SET override_state=NULL,override_until=NULL,updated_at=? WHERE id=1`).bind(now).run();
    await logEvent(env,'INFO','MANUAL_OVERRIDE_EXPIRED',`source=${source}`);
    s=await getSettings(env);
  }

  let desired=schedule.desired,eventKey=schedule.event_key,mode='AUTO';
  if(s.override_state&&s.override_until&&now<s.override_until){desired=s.override_state;eventKey=`OVERRIDE:${s.override_state}:${s.override_until}`;mode='OVERRIDE';}
  const result=await enforceDesired(env,s,desired,eventKey,source,force);
  await noteEvaluation(env,source,mode,desired,result);
  return {mode,desired,schedule,...result};
}

export async function enforceDesired(env,s,desired,eventKey,source,force){
  const now=Date.now();
  const confirmationDue=s.confirm_state===desired&&s.confirm_due_at&&now>=s.confirm_due_at;
  const mustCommand=force||s.last_commanded_state!==desired||confirmationDue;
  if(!mustCommand)return {action:'none',last_commanded_state:s.last_commanded_state,confirmation_due_at:s.confirm_due_at};
  const kind=confirmationDue&&!force?'confirmation':force&&s.last_commanded_state===desired?'forced-reassert':'state-change';
  try{
    const response=await sendVsh(env,desired);
    let confirmState=null,confirmDue=null;
    if(kind!=='confirmation'){
      const mins=numEnv(env,'REASSERT_AFTER_MINUTES',2);
      if(mins>0){confirmState=desired;confirmDue=now+mins*MS_MIN;}
    }
    await env.DB.prepare(`UPDATE settings SET last_commanded_state=?,last_commanded_at=?,last_event_key=?,confirm_state=?,confirm_due_at=?,last_error=NULL,last_success_at=?,updated_at=? WHERE id=1`).bind(desired,now,eventKey,confirmState,confirmDue,now,now).run();
    await logEvent(env,'INFO',desired==='ON'?'COMMAND_ON':'COMMAND_OFF',`${kind}; source=${source}; VSH_HTTP=${response.status}`);
    await recordActuatorCommand(env,{desired,kind,source,status:response.status,detail:'Command accepted by VSH bridge; physical W118 state is not observed.'});
    return {action:desired,command_kind:kind,provider_http_status:response.status,physical_state:'UNKNOWN'};
  }catch(err){
    const message=String(err?.message||err).slice(0,1000);
    await env.DB.prepare(`UPDATE settings SET last_error=?,updated_at=? WHERE id=1`).bind(message,now).run();
    await logEvent(env,'ERROR','COMMAND_FAILED',`${desired}; source=${source}; ${message}`);
    await recordActuatorCommand(env,{desired,kind,source,status:null,detail:`FAILED: ${message}`});
    throw err;
  }
}

export async function sendVsh(env,desired){
  const target=desired==='ON'?env.VSH_ON_URL:env.VSH_OFF_URL;
  if(!target)throw new Error(`Missing VSH_${desired}_URL secret`);
  const parsed=new URL(target);if(!['https:','http:'].includes(parsed.protocol))throw new Error('VSH URL must be HTTP(S)');
  const response=await fetch(target,{method:'GET',redirect:'follow',headers:{'User-Agent':'OutdoorLightFL/6',Accept:'application/json,text/plain,*/*','Cache-Control':'no-cache'}});
  const text=await response.text();if(!response.ok)throw new Error(`Virtual Smart Home HTTP ${response.status}: ${text.slice(0,300)}`);return {status:response.status};
}

export async function manualOverride(env,state){
  const s=await getSettings(env);const schedule=await calculateSchedule(env,s,Date.now());const now=Date.now();let until=schedule.next_transition?.at??(now+6*MS_HOUR);if(until<=now)until=now+MS_HOUR;
  await env.DB.prepare(`UPDATE settings SET auto_enabled=1,override_state=?,override_until=?,test_active=0,confirm_state=NULL,confirm_due_at=NULL,updated_at=? WHERE id=1`).bind(state,until,now).run();
  await logEvent(env,'INFO',state==='ON'?'MANUAL_OVERRIDE_ON':'MANUAL_OVERRIDE_OFF',`until ${new Date(until).toISOString()}`);
  const result=await controllerTick(env,{source:`manual-${state.toLowerCase()}`,force:true});
  return {ok:true,state,override_until:until,next_automatic_transition:schedule.next_transition,result};
}

export async function setAuto(env,enabled){
  await env.DB.prepare(`UPDATE settings SET auto_enabled=?,override_state=NULL,override_until=NULL,test_active=0,confirm_state=NULL,confirm_due_at=NULL,updated_at=? WHERE id=1`).bind(enabled?1:0,Date.now()).run();
  await logEvent(env,'INFO',enabled?'AUTO_RESUMED':'AUTO_PAUSED',enabled?'Resumed from dashboard':'Paused from dashboard');
  if(!enabled)return {ok:true,mode:'PAUSED'};
  await bestEffortEnsureAstronomy(env);const result=await controllerTick(env,{source:'resume-auto',force:true});return {ok:true,result};
}

export async function setPhotoperiod(env,hours,source='dashboard'){
  const n=Number(hours);if(!Number.isFinite(n)||n<=0||n>24)throw new Error('hours must be > 0 and <= 24');const s=await getSettings(env);
  await env.DB.prepare(`UPDATE settings SET photoperiod_hours=?,override_state=NULL,override_until=NULL,confirm_state=NULL,confirm_due_at=NULL,updated_at=? WHERE id=1`).bind(n,Date.now()).run();
  await recordSettingChange(env,'photoperiod_hours',s.photoperiod_hours,n,source);
  await logEvent(env,'INFO','PHOTOPERIOD_CHANGED',`${s.photoperiod_hours} -> ${n} hours; source=${source}`);
  return controllerTick(env,{source:'photoperiod-change',force:true});
}

export async function setAnchor(env,anchor,source='dashboard'){
  const a=String(anchor||'');if(!VALID_ANCHORS.has(a))throw new Error('invalid anchor');const s=await getSettings(env);
  await env.DB.prepare(`UPDATE settings SET anchor=?,override_state=NULL,override_until=NULL,confirm_state=NULL,confirm_due_at=NULL,updated_at=? WHERE id=1`).bind(a,Date.now()).run();
  await recordSettingChange(env,'anchor',s.anchor,a,source);await logEvent(env,'INFO','ANCHOR_CHANGED',`${s.anchor} -> ${a}; source=${source}`);
  return controllerTick(env,{source:'anchor-change',force:true});
}

export async function startCommissioningTest(env){
  const now=Date.now(),onAt=now+2*MS_MIN,offAt=onAt+5*MS_MIN;
  await env.DB.prepare(`UPDATE settings SET auto_enabled=0,override_state=NULL,override_until=NULL,test_active=1,test_on_at=?,test_off_at=?,confirm_state=NULL,confirm_due_at=NULL,updated_at=? WHERE id=1`).bind(onAt,offAt,now).run();
  await logEvent(env,'INFO','TEST_STARTED',`OFF now; ON ${new Date(onAt).toISOString()}; OFF ${new Date(offAt).toISOString()}; final OFF confirmation follows`);
  const result=await controllerTick(env,{source:'test-start',force:true});return {ok:true,result,test_on_at:onAt,test_off_at:offAt};
}

export async function computeNextControlWake(env,now=Date.now()){
  const s=await getSettings(env);const candidates=[];
  if(s.confirm_state&&Number(s.confirm_due_at))candidates.push(Number(s.confirm_due_at));
  if(s.test_active){if(now<Number(s.test_on_at))candidates.push(Number(s.test_on_at));else if(now<Number(s.test_off_at))candidates.push(Number(s.test_off_at));else candidates.push(now+1000);}
  else if(s.auto_enabled){
    if(s.override_state&&Number(s.override_until)&&now<Number(s.override_until))candidates.push(Number(s.override_until));
    try{const schedule=await calculateSchedule(env,s,now);if(schedule.next_transition?.at)candidates.push(Number(schedule.next_transition.at));}catch{}
  }
  const finite=candidates.filter(x=>Number.isFinite(x)&&x>0);if(!finite.length)return null;return Math.max(now+500,Math.min(...finite));
}
