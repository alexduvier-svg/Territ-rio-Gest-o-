// A business day can differ from the timestamp at which a late entry was saved.
const civil=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
export function validDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
export function day(at=Date.now()){if(validDay(at))return at;const d=new Date(at);return Number.isFinite(+d)?civil.format(d):'';}
export function recordDay(record){if(record.date==null||record.date===''){return record.occurrenceConfirmed===true&&validDay(record.occurrenceDay)?record.occurrenceDay:'';}return record.occurrenceConfirmed===true&&validDay(record.occurrenceDay)?record.occurrenceDay:day(record.date);}
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function recordClock(record){if(record.date==null||record.date==='')return '';const d=recordDay(record);if(!d||d!==day(record.date)||validDay(record.date))return '';return clock.format(new Date(record.date));}
// Day-based tools use civil noon for a confirmed late day; no clock is claimed.
export function recordInstant(record){const d=recordDay(record);const at=Date.parse(record.date);return d&&(d!==day(record.date)||!Number.isFinite(at))?Date.parse(d+'T12:00:00-03:00'):at;}
