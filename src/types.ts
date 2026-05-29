export type ActivityType =
  | 'creative'      // 创意分享会
  | 'hackathon'     // 黑客松/共创冲刺
  | 'resource'      // 资源对接/互利合作
  | 'performance'   // 表达/演讲之夜
  | 'offline'       // 线下聚会/能量场
  | 'member';       // 活跃成员

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  activityType: ActivityType;
  participants: number;
  description?: string;
  location?: string;
  startTime?: string; // HH:mm（选填，用于日历提醒）
  endTime?: string;   // HH:mm（选填）
  link?: string;      // 报名/详情链接（选填）
  createdAt: string;
  updatedAt?: string;
}

export interface AppState {
  events: CalendarEvent[];
  currentYear: number;
  githubToken: string;
  githubRepo: string;
  githubOwner: string;
  githubBranch: string;
  lastBackupAt: string | null;
  lastSyncedAt: string | null;
  // 管理员模式：拥有有效 token 并验证后才可编辑/发布
  isAdmin: boolean;
  // 订阅相关配置（管理员设置，随数据一起发布）
  organizerEmail: string;     // 邮箱订阅回退到 mailto 的收件人
  subscribeEndpoint: string;  // 可选：邮箱订阅 POST 端点（如 Formspree）
}

// 发布到 GitHub 的数据文件结构（全量备份）
export interface CalendarDataFile {
  version: string;
  exportedAt: string;
  title?: string;
  organizerEmail?: string;
  subscribeEndpoint?: string;
  events: CalendarEvent[];
}

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; icon: string; color: string }> = {
  creative: { label: '创意分享会', icon: '💡', color: '#f472b6' },
  hackathon: { label: '黑客松/共创冲刺', icon: '⚡', color: '#a855f7' },
  resource: { label: '资源对接/互利合作', icon: '🤝', color: '#ec4899' },
  performance: { label: '表达/演讲之夜', icon: '🎤', color: '#c084fc' },
  offline: { label: '线下聚会/能量场', icon: '🔥', color: '#db2777' },
  member: { label: '活跃成员', icon: '👩', color: '#9333ea' },
};

// Participant count → heat level (0-5)
export function getHeatLevel(participants: number): number {
  if (participants === 0) return 0;
  if (participants <= 5) return 1;
  if (participants <= 15) return 2;
  if (participants <= 30) return 3;
  if (participants <= 60) return 4;
  return 5;
}

// Heat level → pink-purple gradient color
export const HEAT_COLORS = [
  'transparent',           // 0 - no event
  '#fce7f3',               // 1 - very light pink
  '#f9a8d4',               // 2 - light pink
  '#e879a8',               // 3 - medium pink
  '#a855f7',               // 4 - purple
  '#6b21a8',               // 5 - deep purple
];

export const HEAT_BG_CLASSES = [
  '',
  'bg-pink-100',
  'bg-pink-300',
  'bg-pink-500',
  'bg-purple-500',
  'bg-purple-900',
];
