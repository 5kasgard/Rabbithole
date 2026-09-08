import { numEnv, safeParseJson, MS_MIN } from './utils.js';

export const VALID_ANCHORS = new Set(['sunset','dusk','civil_twilight_end','nautical_twilight_end','astronomical_twilight_end','last_light']);
export const VALID_LOCATIONS = new Set(['SHED_INSIDE','OUTDOOR_A','UNKNOWN']);

export async function ensureSettings(env){
  let hours=numEnv(env,'DEFAULT_PHOTOPERIOD_HOURS',18);
  let anchor=env.DEFAULT_ANCHOR||'civil_twilight_end';
  if(!VALID_ANCHORS.has(anchor))anchor='civil_twilight_end';
  if(!(hours>0&&hours<=24))hours=18;
  await env.DB.prepare(`INSERT OR IGNORE INTO settings(id,auto_enabled,photoperiod_hours,anchor,plant_location,test_active,updated_at) VALUES(1,0,?,?,'UNKNOWN',0,?)`).bind(hours,anchor,Date.now()).run();
}

export async function ensureV6(env){
  const row=await env.DB.prepare(`SELECT value FROM v6_meta WHERE key='schema_version'`).first();
  if(!row)throw new Error('Outdoor Light v6 D1 migration has not been applied');
  return row.value;
}

export async function getSettings(env){const row=await env.DB.prepare(`SELECT * FROM settings WHERE id=1`).first();if(!row)throw new Error('settings row missing');return row;}
export async function latestWeatherSnapshot(env,source){return env.DB.prepare(`SELECT * FROM weather_snapshots WHERE source=? ORDER BY fetched_at DESC LIMIT 1`).bind(source).first();}
export async function previousWeatherSnapshot(env,beforeTs){return env.DB.prepare(`SELECT * FROM weather_snapshots WHERE source='open-meteo-best-match' AND fetched_at<? ORDER BY fetched_at DESC LIMIT 1`).bind(beforeTs-30*MS_MIN).first();}
export async function latestObservation(env){return env.DB.prepare(`SELECT * FROM observation_history ORDER BY COALESCE(observed_at,fetched_at) DESC LIMIT 1`).first();}
export async function latestSatelliteSolar(env){return env.DB.prepare(`SELECT * FROM satellite_solar_history ORDER BY COALESCE(observed_at,fetched_at) DESC LIMIT 1`).first();}
export async function latestWarningSnapshot(env){return env.DB.prepare(`SELECT * FROM warning_snapshots ORDER BY fetched_at DESC LIMIT 1`).first();}
export async function latestPlanner(env){return env.DB.prepare(`SELECT * FROM planner_snapshots ORDER BY generated_at DESC LIMIT 1`).first();}
export async function latestAirQuality(env){return env.DB.prepare(`SELECT * FROM air_quality_snapshots ORDER BY fetched_at DESC LIMIT 1`).first();}

export async function logEvent(env,level,event,detail=''){
  await env.DB.prepare(`INSERT INTO event_log(ts,level,event,detail) VALUES(?,?,?,?)`).bind(Date.now(),level,event,String(detail).slice(0,1500)).run();
  if(Math.random()<0.01){await env.DB.prepare(`DELETE FROM event_log WHERE id NOT IN (SELECT id FROM event_log ORDER BY id DESC LIMIT 5000)`).run();}
}

export async function safeTask(env,label,fn){try{return {ok:true,result:await fn()};}catch(err){const msg=String(err?.message||err).slice(0,1000);try{await logEvent(env,'WARN',`TASK_FAILED:${label}`,msg);}catch{}return {ok:false,error:msg};}}

export async function recordControllerError(env,event,err){const msg=String(err?.message||err).slice(0,1000);try{await env.DB.prepare(`UPDATE settings SET last_error=?,updated_at=? WHERE id=1`).bind(msg,Date.now()).run();await logEvent(env,'ERROR',event,msg);}catch{}}

export async function recordSettingChange(env,key,oldValue,newValue,source='dashboard',note=''){
  await env.DB.prepare(`INSERT INTO controller_setting_history(ts,setting_key,old_value,new_value,source,note) VALUES(?,?,?,?,?,?)`).bind(Date.now(),key,String(oldValue??''),String(newValue??''),source,note).run();
}

export async function recordActuatorCommand(env,{desired,kind,source,status,detail=''}){
  await env.DB.prepare(`INSERT INTO actuator_commands(ts,device_id,desired_state,command_kind,source,provider_http_status,observed_state,observed_at,detail) VALUES(?,?,?,?,?,?,NULL,NULL,?)`).bind(Date.now(),'OUTDOOR_LIGHT_W118',desired,kind,source,status??null,detail).run();
}

export async function getSchedulerHealth(env){return env.DB.prepare(`SELECT * FROM scheduler_health WHERE id=1`).first();}

export async function patchSchedulerHealth(env,patch){
  const allowed=['primary_method','primary_bound','alarm_due_at','alarm_last_armed_at','alarm_last_fired_at','alarm_last_completed_at','alarm_last_error','watchdog_cron','watchdog_last_scheduled_at','watchdog_last_started_at','watchdog_last_completed_at','watchdog_last_error','last_evaluation_at','last_evaluation_source','last_evaluation_mode','last_evaluation_desired','last_evaluation_action'];
  const keys=Object.keys(patch).filter(k=>allowed.includes(k));
  if(!keys.length)return;
  const sql=`UPDATE scheduler_health SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=? WHERE id=1`;
  await env.DB.prepare(sql).bind(...keys.map(k=>patch[k]),Date.now()).run();
}

export async function recentLogs(env,limit=100){const rows=await env.DB.prepare(`SELECT id,ts,level,event,detail FROM event_log ORDER BY id DESC LIMIT ?`).bind(Math.max(1,Math.min(500,Number(limit)||100))).all();return rows.results||[];}

export async function listDataSources(env){const rows=await env.DB.prepare(`SELECT * FROM data_sources ORDER BY installed_state,id`).all();return rows.results||[];}
export async function listDevices(env){const rows=await env.DB.prepare(`SELECT * FROM device_registry ORDER BY id`).all();return rows.results||[];}

export function weatherSnapshotPublic(row,now=Date.now()){if(!row)return null;return {id:row.id,fetched_at:row.fetched_at,source:row.source,age_minutes:Math.round((now-row.fetched_at)/MS_MIN),summary:safeParseJson(row.summary_json,null)};}
