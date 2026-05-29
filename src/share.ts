import { CalendarEvent, ACTIVITY_TYPES } from './types';

export type ShareScope = 'event' | 'day' | 'month' | 'year';

// Generate a text summary for sharing
export function generateShareText(
  scope: ShareScope,
  events: CalendarEvent[],
  date?: string,
  year?: number
): string {
  const header = '✨ 0xHerstory大湾区分部 · Women的2026\n湾区通四海，有她有未来！\n\n';

  if (scope === 'event' && events.length === 1) {
    const e = events[0];
    const type = ACTIVITY_TYPES[e.activityType];
    return (
      header +
      `${type.icon} ${e.title}\n` +
      `📅 日期：${e.date}\n` +
      `🏷️ 类型：${type.label}\n` +
      `👥 参与人数：${e.participants}人\n` +
      (e.location ? `📍 地点：${e.location}\n` : '') +
      (e.description ? `\n${e.description}\n` : '') +
      '\n#0xHerstory #大湾区 #Women的2026'
    );
  }

  if (scope === 'day' && date) {
    const total = events.reduce((s, e) => s + e.participants, 0);
    const lines = events
      .map((e) => `  ${ACTIVITY_TYPES[e.activityType].icon} ${e.title}（${e.participants}人）`)
      .join('\n');
    return (
      header +
      `📅 ${date} 的活动记录\n\n` +
      `共 ${events.length} 场活动，${total} 人次参与\n\n` +
      lines +
      '\n\n#0xHerstory #大湾区 #Women的2026'
    );
  }

  if (scope === 'month' && date) {
    const [y, m] = date.split('-');
    const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const total = events.reduce((s, e) => s + e.participants, 0);
    const byType: Record<string, number> = {};
    events.forEach((e) => {
      byType[e.activityType] = (byType[e.activityType] || 0) + 1;
    });
    const typeLines = Object.entries(byType)
      .map(([t, c]) => `  ${ACTIVITY_TYPES[t as keyof typeof ACTIVITY_TYPES].icon} ${ACTIVITY_TYPES[t as keyof typeof ACTIVITY_TYPES].label}：${c}场`)
      .join('\n');

    return (
      header +
      `📅 ${y}年${months[parseInt(m) - 1]}月 活动总结\n\n` +
      `🎉 共 ${events.length} 场活动\n` +
      `👥 累计 ${total} 人次参与\n\n` +
      `活动类型分布：\n${typeLines}\n\n` +
      '#0xHerstory #大湾区 #Women的2026'
    );
  }

  if (scope === 'year') {
    const y = year || new Date().getFullYear();
    const total = events.reduce((s, e) => s + e.participants, 0);
    const byType: Record<string, number> = {};
    events.forEach((e) => {
      byType[e.activityType] = (byType[e.activityType] || 0) + 1;
    });
    const typeLines = Object.entries(byType)
      .map(([t, c]) => `  ${ACTIVITY_TYPES[t as keyof typeof ACTIVITY_TYPES].icon} ${ACTIVITY_TYPES[t as keyof typeof ACTIVITY_TYPES].label}：${c}场`)
      .join('\n');

    return (
      header +
      `🗓️ ${y}年 年度总结\n\n` +
      `🎊 全年共 ${events.length} 场活动\n` +
      `👥 累计 ${total} 人次参与\n` +
      `🌟 365天，我们留下了一个个彼此推动的瞬间\n\n` +
      `活动类型分布：\n${typeLines}\n\n` +
      `这是我们的Herstory，被共同写下的每一天。❤️\n\n` +
      '#0xHerstory #大湾区 #Women的2026'
    );
  }

  return header + `共 ${events.length} 场活动\n#0xHerstory #大湾区 #Women的2026`;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
}

// Generate shareable JSON data URL
export function generateShareDataURL(events: CalendarEvent[]): string {
  const data = { version: '1.0', events, exportedAt: new Date().toISOString() };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  return URL.createObjectURL(blob);
}

// Download JSON
export function downloadJSON(events: CalendarEvent[], filename: string) {
  const data = { version: '1.0', events, exportedAt: new Date().toISOString() };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
