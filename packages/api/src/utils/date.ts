export function createDate(date = new Date()): string {
  const d = '2-digit';
  const dateStr = date.toLocaleDateString('en-CA');
  const time = date
    .toLocaleTimeString(undefined, { hour: d, minute: d, second: d })
    .replace(' ', '-')
    .replaceAll(':', '-');
  return `${dateStr}_${time}`;
}
