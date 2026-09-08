import { MS_DAY, MS_HOUR, brisbaneDate, dateDiffDays, isoToMs, numEnv } from './utils.js';
import { getSettings, logEvent, VALID_ANCHORS } from './db.js';

const sinDeg=x=>Math.sin(x*Math.PI/180);
const cosDeg=x=>Math.cos(x*Math.PI/180);
const radToDeg=x=>x*180/Math.PI;
const degToRad=x=>x*Math.PI/180;
const norm360=x=>((x%360)+360)%360;

export async function bestEffortEnsureAstronomy(env){
  try{return await ensureAstronomy(env);}catch(err){
    await logEvent(env,'WARN','ASTRONOMY_PRIMARY_FAILED',String(err?.message||err));
    try{return {ok:true,fallback:await ensureFallbackAstronomy(env)};}catch(fallbackErr){
      await logEvent(env,'ERROR','ASTRONOMY_FALLBACK_FAILED',String(fallbackErr?.message||fallbackErr));
      return {ok:false,error:String(fallbackErr?.message||fallbackErr)};
    }
  }
}

export async function ensureAstronomy(env){
  const s=await getSettings(env);
  const today=brisbaneDate(0);
  const hasToday=await env.DB.prepare(`SELECT day FROM astronomy WHERE day=?`).bind(today).first();
  if(!hasToday)return refreshAstronomy(env,true);
  if(!s.astronomy_until)return refreshAstronomy(env,true);
  const daysLeft=dateDiffDays(today,s.astronomy_until);
  const threshold=numEnv(env,'REFRESH_WHEN_DAYS_LEFT',7);
  if(daysLeft<=threshold){
    try{return await refreshAstronomy(env,false);}catch(err){await logEvent(env,'WARN','ASTRONOMY_REFRESH_DEFERRED',String(err?.message||err));return {refreshed:false,stale_refresh:true,until:s.astronomy_until};}
  }
  return {refreshed:false,until:s.astronomy_until};
}

export async function refreshAstronomy(env,forced=false){
  const lat=numEnv(env,'GROW_LAT',-27.615000),lng=numEnv(env,'GROW_LNG',152.970278);
  const planDays=Math.max(14,Math.min(40,numEnv(env,'PLAN_DAYS',35)));
  const start=brisbaneDate(-1),end=brisbaneDate(planDays);
  const url=new URL('https://api.sunrise-sunset.org/v2');
  url.searchParams.set('lat',String(lat));url.searchParams.set('lng',String(lng));url.searchParams.set('date_start',start);url.searchParams.set('date_end',end);url.searchParams.set('tz',env.TIMEZONE??'Australia/Brisbane');
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'OutdoorLightFL/6'}});
  if(!response.ok)throw new Error(`Astronomy API HTTP ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data.days)||!data.days.length)throw new Error('Astronomy API returned no days');
  const statements=data.days.map(d=>env.DB.prepare(`INSERT INTO astronomy(day,sunset,dusk,civil_twilight_end,nautical_twilight_end,astronomical_twilight_end,last_light,source,fetched_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET sunset=excluded.sunset,dusk=excluded.dusk,civil_twilight_end=excluded.civil_twilight_end,nautical_twilight_end=excluded.nautical_twilight_end,astronomical_twilight_end=excluded.astronomical_twilight_end,last_light=excluded.last_light,source=excluded.source,fetched_at=excluded.fetched_at`).bind(d.date,isoToMs(d.sunset),isoToMs(d.dusk),isoToMs(d.civil_twilight_end),isoToMs(d.nautical_twilight_end),isoToMs(d.astronomical_twilight_end),isoToMs(d.last_light),'sunrise-sunset.org-v2',Date.now()));
  await env.DB.batch(statements);
  await env.DB.prepare(`UPDATE settings SET astronomy_until=?,astronomy_refreshed_at=?,astronomy_source=?,updated_at=? WHERE id=1`).bind(end,Date.now(),'sunrise-sunset.org-v2',Date.now()).run();
  await logEvent(env,'INFO','ASTRONOMY_REFRESH',`${start}..${end}; days=${data.days.length}; forced=${forced}`);
  return {refreshed:true,start,end,days:data.days.length};
}

export async function ensureFallbackAstronomy(env){
  const lat=numEnv(env,'GROW_LAT',-27.615000),lng=numEnv(env,'GROW_LNG',152.970278);
  const days=[brisbaneDate(-1),brisbaneDate(0),brisbaneDate(1),brisbaneDate(2)];
  const statements=[];
  for(const day of days){const events=localAstronomyForDay(day,lat,lng);statements.push(env.DB.prepare(`INSERT INTO astronomy(day,sunset,dusk,civil_twilight_end,nautical_twilight_end,astronomical_twilight_end,last_light,source,fetched_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET sunset=excluded.sunset,dusk=excluded.dusk,civil_twilight_end=excluded.civil_twilight_end,nautical_twilight_end=excluded.nautical_twilight_end,astronomical_twilight_end=excluded.astronomical_twilight_end,last_light=excluded.last_light,source=excluded.source,fetched_at=excluded.fetched_at`).bind(day,events.sunset,events.civil,events.civil,events.nautical,events.astronomical,events.astronomical,'local-NOAA-style-fallback',Date.now()));}
  await env.DB.batch(statements);
  await env.DB.prepare(`UPDATE settings SET astronomy_until=?,astronomy_refreshed_at=?,astronomy_source=?,updated_at=? WHERE id=1`).bind(brisbaneDate(2),Date.now(),'local-NOAA-style-fallback',Date.now()).run();
  await logEvent(env,'WARN','ASTRONOMY_FALLBACK_USED','Generated local mathematical twilight for -1..+2 days');
  return {source:'local-NOAA-style-fallback',until:brisbaneDate(2)};
}

export function localAstronomyForDay(day,lat,lng){return {sunset:sunsetUtcMs(day,lat,lng,90.833),civil:sunsetUtcMs(day,lat,lng,96),nautical:sunsetUtcMs(day,lat,lng,102),astronomical:sunsetUtcMs(day,lat,lng,108)};}

export function sunsetUtcMs(day,latDeg,lonDeg,zenithDeg){
  const [year,month,date]=day.split('-').map(Number);const d=new Date(Date.UTC(year,month-1,date));const N=Math.floor((d-Date.UTC(year,0,0))/MS_DAY);const lngHour=lonDeg/15;const t=N+((18-lngHour)/24);const M=(0.9856*t)-3.289;let L=M+1.916*sinDeg(M)+0.020*sinDeg(2*M)+282.634;L=norm360(L);let RA=radToDeg(Math.atan(0.91764*Math.tan(degToRad(L))));RA=norm360(RA);const Lq=Math.floor(L/90)*90,RAq=Math.floor(RA/90)*90;RA=(RA+(Lq-RAq))/15;const sinDec=0.39782*sinDeg(L);const cosDec=Math.cos(Math.asin(sinDec));const cosH=(cosDeg(zenithDeg)-sinDec*sinDeg(latDeg))/(cosDec*cosDeg(latDeg));if(cosH<-1||cosH>1)throw new Error(`No sunset/twilight solution for ${day}`);const H=radToDeg(Math.acos(cosH))/15;const T=H+RA-(0.06571*t)-6.622;let UT=T-lngHour;UT=((UT%24)+24)%24;return Date.UTC(year,month-1,date,0,0,0)+UT*MS_HOUR;
}

export async function calculateSchedule(env,s,now=Date.now()){
  const today=brisbaneDate(0,now),endDay=brisbaneDate(2,now);
  let result=await env.DB.prepare(`SELECT * FROM astronomy WHERE day>=? AND day<=? ORDER BY day`).bind(today,endDay).all();let rows=result.results||[];
  if(rows.length<2){await ensureFallbackAstronomy(env);result=await env.DB.prepare(`SELECT * FROM astronomy WHERE day>=? AND day<=? ORDER BY day`).bind(today,endDay).all();rows=result.results||[];}
  if(!rows.length)throw new Error('No astronomy rows available for lighting schedule');
  const anchor=String(s.anchor);if(!VALID_ANCHORS.has(anchor))throw new Error(`Invalid stored anchor: ${anchor}`);const hours=Number(s.photoperiod_hours);const events=[];let active=null;
  for(const row of rows){const off=Number(row[anchor]);if(!Number.isFinite(off)||off<=0)continue;const on=off-hours*MS_HOUR;events.push({type:'ON',at:on,day:row.day});events.push({type:'OFF',at:off,day:row.day});if(now>=on&&now<off)active={day:row.day,on,off,source:row.source};}
  events.sort((a,b)=>a.at-b.at);const next=events.find(e=>e.at>now)||null;
  return {desired:active?'ON':'OFF',event_key:active?`${active.day}:ON-WINDOW`:`OFF-WINDOW:${today}`,active_window:active,next_transition:next,photoperiod_hours:hours,anchor};
}

export function siteConfig(env){return {latitude:numEnv(env,'GROW_LAT',-27.615000),longitude:numEnv(env,'GROW_LNG',152.970278),elevation_m:numEnv(env,'GROW_ELEVATION_M',60),faces_true_deg:{door:numEnv(env,'FACE_DOOR_DEG',60),side_se:numEnv(env,'FACE_SE_DEG',150),rear:numEnv(env,'FACE_REAR_DEG',240),side_nw:numEnv(env,'FACE_NW_DEG',330)},outdoor_zone_horizon_calibrated:false};}
