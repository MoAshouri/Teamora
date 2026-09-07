/**
 * Week columns for the Hours arcade niche.
 * FA follows the product default (week starts Saturday); EN/HY use Monday-first work week.
 * `todayCol` is the column index that should get the terracotta “today” bricks.
 */
export function weekColumns(locale: string): { labels: string[]; todayCol: number } {
  const jsDay = new Date().getDay(); // 0 = Sunday … 6 = Saturday

  if (locale === 'fa') {
    // شنبه … جمعه
    const order = [6, 0, 1, 2, 3, 4, 5];
    return {
      labels: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
      todayCol: order.indexOf(jsDay),
    };
  }

  // Monday … Sunday
  const order = [1, 2, 3, 4, 5, 6, 0];
  if (locale === 'hy') {
    return {
      labels: ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'],
      todayCol: order.indexOf(jsDay),
    };
  }

  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    todayCol: order.indexOf(jsDay),
  };
}
