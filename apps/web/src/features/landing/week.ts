import { jsWeekdayInZone } from '@/lib/dates';

/**
 * Week columns for the Hours arcade niche.
 * FA follows the product default (week starts Saturday); EN/HY use Monday-first work week.
 * `todayCol` is the column index that should get the terracotta “today” bricks.
 */
function landingTimeZone(locale: string) {
  if (locale === 'fa') return 'Asia/Tehran';
  if (locale === 'hy') return 'Asia/Yerevan';
  return null;
}

export function weekColumns(
  locale: string,
  now = new Date(),
): { labels: string[]; todayCol: number } {
  const zone = landingTimeZone(locale);
  const localDay = now.getDay();
  const jsDay = zone ? jsWeekdayInZone(zone, now) : localDay;

  let result: { labels: string[]; todayCol: number };
  if (locale === 'fa') {
    // شنبه … جمعه
    const order = [6, 0, 1, 2, 3, 4, 5];
    result = {
      labels: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
      todayCol: order.indexOf(jsDay),
    };
  } else {
    // Monday … Sunday
    const order = [1, 2, 3, 4, 5, 6, 0];
    result =
      locale === 'hy'
        ? {
            labels: ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'],
            todayCol: order.indexOf(jsDay),
          }
        : {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            todayCol: order.indexOf(jsDay),
          };
  }

  // #region agent log
  fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'LW',location:'week.ts:weekColumns',message:'landing today column uses locale timezone',data:{locale,zone,iso:now.toISOString(),localDay,utcDay:now.getUTCDay(),zonedDay:jsDay,todayCol:result.todayCol,usedLocal:!zone},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return result;
}
