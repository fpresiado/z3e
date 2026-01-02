export function formatPacific(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const dateObj: any = {};
  parts.forEach(part => {
    if (part.type !== 'literal') dateObj[part.type] = part.value;
  });
  
  const tz = date.getTimezoneOffset() === -480 ? 'PST' : 'PDT'; // -480 = PST offset
  return `${dateObj.year}-${dateObj.month}-${dateObj.day} ${dateObj.hour}:${dateObj.minute}:${dateObj.second} ${tz}`;
}
