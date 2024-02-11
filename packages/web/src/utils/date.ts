export function createDate(date = new Date()): string {
  const d = '2-digit';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: d,
    hour: d,
    minute: d,
    second: d
  }).format(date);
}
