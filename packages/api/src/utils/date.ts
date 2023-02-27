export function createDate(date = new Date()): string {
  const d = '2-digit';
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: d,
    day: d,
    year: 'numeric',
    hour: d,
    minute: d,
    second: d
  }).format(date);
  return dateStr
    .replaceAll('/', '-')
    .replaceAll(':', '-')
    .replace(', ', '_')
    .replace(/\u202f/g, '-');
}
