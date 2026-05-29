import { CalendarEvent, ACTIVITY_TYPES } from './types';

// 将活动转换为日历订阅文件（.ics），支持导入 Google / Apple / Outlook 日历，
// 并附带提醒闹钟，从而为参与者提供"原生的活动提醒和通知"。

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// 转义 ICS 文本中的特殊字符
function escapeICS(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// 按 RFC5545 折叠超过 75 字节的行
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 0) {
    chunks.push(' ' + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  return chunks.join('\r\n');
}

function toUTCStamp(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

// 将本地日期/时间转为带时区(Asia/Shanghai, UTC+8)的浮动 UTC 时间串
function localToUTCStamp(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:mm —— 视为 UTC+8
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // UTC+8 → 减 8 小时得到 UTC
  const dt = new Date(Date.UTC(y, m - 1, d, hh - 8, mm, 0));
  return toUTCStamp(dt);
}

function eventToVEVENT(e: CalendarEvent, now: string): string {
  const type = ACTIVITY_TYPES[e.activityType];
  const lines: string[] = [];
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${e.id}@herstory-calendar`);
  lines.push(`DTSTAMP:${now}`);

  if (e.startTime) {
    const start = localToUTCStamp(e.date, e.startTime);
    const endTime = e.endTime || addHour(e.startTime);
    const end = localToUTCStamp(e.date, endTime);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
  } else {
    // 全天事件
    const dateStr = e.date.replace(/-/g, '');
    const next = nextDay(e.date).replace(/-/g, '');
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${next}`);
  }

  lines.push(foldLine(`SUMMARY:${escapeICS(`${type?.icon || ''} ${e.title}`)}`));

  const descParts: string[] = [];
  descParts.push(`类型：${type?.label || e.activityType}`);
  descParts.push(`参与人数：${e.participants}人`);
  if (e.description) descParts.push(`\n${e.description}`);
  if (e.link) descParts.push(`\n报名/详情：${e.link}`);
  lines.push(foldLine(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`));

  if (e.location) lines.push(foldLine(`LOCATION:${escapeICS(e.location)}`));
  if (e.link) lines.push(foldLine(`URL:${escapeICS(e.link)}`));

  // 提醒：活动开始前 1 天 与 1 小时各一次
  lines.push('BEGIN:VALARM');
  lines.push('TRIGGER:-P1D');
  lines.push('ACTION:DISPLAY');
  lines.push(foldLine(`DESCRIPTION:明天有活动：${escapeICS(e.title)}`));
  lines.push('END:VALARM');

  lines.push('BEGIN:VALARM');
  lines.push('TRIGGER:-PT1H');
  lines.push('ACTION:DISPLAY');
  lines.push(foldLine(`DESCRIPTION:1小时后开始：${escapeICS(e.title)}`));
  lines.push('END:VALARM');

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function addHour(time: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const h = (hh + 2) % 24; // 默认时长 2 小时
  return `${pad(h)}:${pad(mm)}`;
}

function nextDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function generateICS(events: CalendarEvent[], calendarName = '0xHerstory · Women的活动日历'): string {
  const now = toUTCStamp(new Date());
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//0xHerstory//Calendar//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(foldLine(`X-WR-CALNAME:${escapeICS(calendarName)}`));
  lines.push('X-WR-TIMEZONE:Asia/Shanghai');
  events.forEach((e) => lines.push(eventToVEVENT(e, now)));
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(events: CalendarEvent[], filename = 'herstory-calendar.ics') {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 生成单个活动的「添加到 Google 日历」链接
export function googleCalendarUrl(e: CalendarEvent): string {
  const type = ACTIVITY_TYPES[e.activityType];
  let dates: string;
  if (e.startTime) {
    const start = localToUTCStamp(e.date, e.startTime);
    const end = localToUTCStamp(e.date, e.endTime || addHour(e.startTime));
    dates = `${start}/${end}`;
  } else {
    const d = e.date.replace(/-/g, '');
    const next = nextDay(e.date).replace(/-/g, '');
    dates = `${d}/${next}`;
  }
  const details = [
    `类型：${type?.label || ''}`,
    `参与人数：${e.participants}人`,
    e.description || '',
    e.link ? `报名/详情：${e.link}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${type?.icon || ''} ${e.title}`,
    dates,
    details,
    location: e.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
