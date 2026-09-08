export const MS_MIN = 60_000;
export const MS_HOUR = 3_600_000;
export const MS_DAY = 86_400_000;

export function numEnv(env,key,fallback){const n=Number(env?.[key]);return Number.isFinite(n)?n:fallback;}
export function boolEnv(env,key,fallback){if(env?.[key]==null)return fallback;return ['1','true','yes','on'].includes(String(env[key]).toLowerCase());}
export function toNum(v){const n=Number(v);return Number.isFinite(n)?n:null;}
export function round1(v){return Number.isFinite(v)?Math.round(v*10)/10:null;}
export function round2(v){return Number.isFinite(v)?Math.round(v*100)/100:null;}
export function maxFinite(arr){const a=arr.filter(Number.isFinite);return a.length?Math.max(...a):null;}
export function minFinite(arr){const a=arr.filter(Number.isFinite);return a.length?Math.min(...a):null;}
export function meanFinite(arr){const a=arr.filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null;}
export function safeParseJson(s,fallback){try{return JSON.parse(s);}catch{return fallback;}}
export function isoToMs(v){if(!v)return null;const n=new Date(v).getTime();return Number.isFinite(n)?n:null;}
export function addOneHourIso(localIso){return addMinutesLocal(localIso,60);}
export function floorHourIso(s){return `${s.slice(0,13)}:00`;}
export function ceilHourIso(s){if(s.slice(14,16)==='00')return floorHourIso(s);return addMinutesLocal(floorHourIso(s),60);}
export function addMinutesLocal(localIso,minutes){const ms=Date.parse(`${localIso.length===16?localIso+':00':localIso}+10:00`)+minutes*MS_MIN;return new Intl.DateTimeFormat('sv-SE',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms)).replace(' ','T');}
export function subtractMinutesLocal(localIso,minutes){return addMinutesLocal(localIso,-minutes);}
export function brisbaneDate(offsetDays=0,now=Date.now()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));const val=t=>Number(p.find(x=>x.type===t)?.value);const base=Date.UTC(val('year'),val('month')-1,val('day'));const d=new Date(base+offsetDays*MS_DAY);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;}
export function addDaysIso(day,offset){const [y,m,d]=day.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d)+offset*MS_DAY);return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;}
export function dateDiffDays(a,b){const A=a.split('-').map(Number),B=b.split('-').map(Number);return Math.round((Date.UTC(B[0],B[1]-1,B[2])-Date.UTC(A[0],A[1]-1,A[2]))/MS_DAY);}
export function weekdayNumber(day){const [y,m,d]=day.split('-').map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay();}
export function weekdayName(day){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][weekdayNumber(day)];}
export function currentBrisbaneLocalIso(now=Date.now()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(now)).replace(' ','T');}
export function localDateToMs(day,hour='00:00'){return Date.parse(`${day}T${hour}:00+10:00`);}
export function parseBomObservationTime(localFull,utc){if(utc&&/^\d{14}$/.test(String(utc))){const s=String(utc);return Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8),+s.slice(8,10),+s.slice(10,12),+s.slice(12,14));}if(localFull&&/^\d{14}$/.test(String(localFull))){const s=String(localFull);return Date.parse(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}:${s.slice(12,14)}+10:00`);}return Date.now();}
export function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
export function escAttr(s){return esc(s).replaceAll("'",'&#39;');}
export function fmtLocal(ms){if(!ms)return '—';return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',dateStyle:'medium',timeStyle:'short'}).format(new Date(Number(ms)));}
export function fmtLocalIso(s){if(!s)return '—';return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',dateStyle:'medium',timeStyle:'short'}).format(new Date(`${s.length===16?s+':00':s}+10:00`));}
export function shortTime(s){return s?s.slice(11,16):'—';}
export function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function icsEsc(s){return String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
export function icsUtc(ms){return new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
export function icsLocal(s){return String(s).replace(/[-:]/g,'')+'00';}
export function json(obj,status=200){return new Response(JSON.stringify(obj,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
export function html(body,status=200){return new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; frame-ancestors 'none'; base-uri 'none';",'X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
export async function safeJson(request){try{return await request.json();}catch{return {};}}
export function saturationVapourPressureKpa(tempC){if(!Number.isFinite(Number(tempC)))return null;const t=Number(tempC);return 0.6108*Math.exp((17.27*t)/(t+237.3));}
export function airVpdKpa(tempC,rhPct){const es=saturationVapourPressureKpa(tempC);const rh=Number(rhPct);if(!Number.isFinite(es)||!Number.isFinite(rh))return null;return Math.max(0,es*(1-rh/100));}
export function ageLabelFromDate(startDate,today=brisbaneDate(0)){if(!startDate)return {days:null,weeks:null,day_of_week:null,label:'—'};const days=Math.max(0,dateDiffDays(startDate,today));const weeks=Math.floor(days/7);const d=days%7;return {days,weeks:weeks+1,day_of_week:d+1,label:`Week ${weeks+1} Day ${d+1}`};}
export function healthState(ageMinutes,expectedMinutes){if(!Number.isFinite(ageMinutes))return 'UNKNOWN';if(ageMinutes<=expectedMinutes*1.5)return 'HEALTHY';if(ageMinutes<=expectedMinutes*3)return 'DEGRADED';return 'STALE';}
export function timingSafeEqual(a,b){a=String(a);b=String(b);if(a.length!==b.length)return false;let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);return out===0;}
export function parseCookies(header){const out={};for(const part of String(header||'').split(';')){const i=part.indexOf('=');if(i>=0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}return out;}
export function makeAuthCookie(key){return `outdoor_control=${encodeURIComponent(key)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`;}
export function downsample(rows,maxPoints=360){if(rows.length<=maxPoints)return rows;const step=Math.ceil(rows.length/maxPoints);const out=[];for(let i=0;i<rows.length;i+=step)out.push(rows[i]);return out;}
export function median(values){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
