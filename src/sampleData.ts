import { CalendarEvent } from './types';

function id() {
  return Math.random().toString(36).slice(2);
}

export const SAMPLE_EVENTS: CalendarEvent[] = [
  // January 2026
  { id: id(), date: '2026-01-05', title: '创意分享会第1期', activityType: 'creative', participants: 12, location: '深圳南山', description: '新年首场创意分享，一起展望2026', createdAt: '2026-01-05T10:00:00Z' },
  { id: id(), date: '2026-01-08', title: '跨年黑客松', activityType: 'hackathon', participants: 35, location: '广州天河', description: '48小时共创冲刺，产出5个项目', createdAt: '2026-01-08T10:00:00Z' },
  { id: id(), date: '2026-01-15', title: '资源对接沙龙', activityType: 'resource', participants: 20, location: '香港九龙', createdAt: '2026-01-15T10:00:00Z' },
  { id: id(), date: '2026-01-21', title: '演讲之夜第1期', activityType: 'performance', participants: 45, location: '深圳福田', createdAt: '2026-01-21T10:00:00Z' },
  { id: id(), date: '2026-01-26', title: '春节能量场', activityType: 'offline', participants: 68, location: '广州越秀', createdAt: '2026-01-26T10:00:00Z' },

  // February 2026
  { id: id(), date: '2026-02-04', title: '创意分享会第2期', activityType: 'creative', participants: 15, location: '深圳宝安', createdAt: '2026-02-04T10:00:00Z' },
  { id: id(), date: '2026-02-11', title: 'AI创业黑客松', activityType: 'hackathon', participants: 42, location: '广州海珠', createdAt: '2026-02-11T10:00:00Z' },
  { id: id(), date: '2026-02-18', title: '湾区姐妹聚会', activityType: 'offline', participants: 30, location: '深圳南山', createdAt: '2026-02-18T10:00:00Z' },
  { id: id(), date: '2026-02-22', title: '导师资源对接', activityType: 'resource', participants: 18, location: '线上', createdAt: '2026-02-22T10:00:00Z' },
  { id: id(), date: '2026-02-25', title: '女性科技演讲夜', activityType: 'performance', participants: 55, location: '香港铜锣湾', createdAt: '2026-02-25T10:00:00Z' },

  // March 2026
  { id: id(), date: '2026-03-05', title: '创意分享会第3期', activityType: 'creative', participants: 22, location: '深圳罗湖', createdAt: '2026-03-05T10:00:00Z' },
  { id: id(), date: '2026-03-08', title: '三八节特别活动', activityType: 'offline', participants: 120, location: '广州天河', description: '女神节特别庆典', createdAt: '2026-03-08T10:00:00Z' },
  { id: id(), date: '2026-03-15', title: 'Web3共创冲刺', activityType: 'hackathon', participants: 38, location: '深圳南山', createdAt: '2026-03-15T10:00:00Z' },
  { id: id(), date: '2026-03-20', title: '投融资资源对接', activityType: 'resource', participants: 25, location: '香港中环', createdAt: '2026-03-20T10:00:00Z' },
  { id: id(), date: '2026-03-25', title: 'TED式演讲之夜', activityType: 'performance', participants: 60, location: '广州珠江新城', createdAt: '2026-03-25T10:00:00Z' },
  { id: id(), date: '2026-03-28', title: '创始人圆桌对话', activityType: 'resource', participants: 15, location: '深圳南山', createdAt: '2026-03-28T10:00:00Z' },

  // April 2026
  { id: id(), date: '2026-04-02', title: '创意分享会第4期', activityType: 'creative', participants: 28, location: '深圳科技园', createdAt: '2026-04-02T10:00:00Z' },
  { id: id(), date: '2026-04-08', title: '生物科技黑客松', activityType: 'hackathon', participants: 45, location: '广州大学城', createdAt: '2026-04-08T10:00:00Z' },
  { id: id(), date: '2026-04-15', title: '成长加速营', activityType: 'member', participants: 35, location: '深圳南山', createdAt: '2026-04-15T10:00:00Z' },
  { id: id(), date: '2026-04-20', title: '湾区峰会', activityType: 'offline', participants: 200, location: '深圳会展中心', description: '年度最大线下活动', createdAt: '2026-04-20T10:00:00Z' },
  { id: id(), date: '2026-04-25', title: '职场女性沙龙', activityType: 'resource', participants: 32, location: '香港湾仔', createdAt: '2026-04-25T10:00:00Z' },
  { id: id(), date: '2026-04-29', title: '创意品牌演讲夜', activityType: 'performance', participants: 70, location: '广州天河', createdAt: '2026-04-29T10:00:00Z' },

  // May 2026
  { id: id(), date: '2026-05-06', title: '创意分享会第5期', activityType: 'creative', participants: 25, location: '深圳南山', startTime: '19:00', endTime: '21:00', createdAt: '2026-05-06T10:00:00Z' },
  { id: id(), date: '2026-05-12', title: '绿色科技黑客松', activityType: 'hackathon', participants: 50, location: '广州南沙', startTime: '09:30', endTime: '18:00', createdAt: '2026-05-12T10:00:00Z' },
  { id: id(), date: '2026-05-16', title: '亲子科技体验营', activityType: 'member', participants: 40, location: '深圳福田', startTime: '14:00', endTime: '17:00', createdAt: '2026-05-16T10:00:00Z' },
  { id: id(), date: '2026-05-20', title: '全球链接资源对接', activityType: 'resource', participants: 28, location: '线上+香港', startTime: '20:00', endTime: '21:30', createdAt: '2026-05-20T10:00:00Z' },
  { id: id(), date: '2026-05-27', title: '科技女性演讲夜', activityType: 'performance', participants: 80, location: '深圳南山', startTime: '19:30', endTime: '22:00', createdAt: '2026-05-27T10:00:00Z' },
  { id: id(), date: '2026-05-30', title: '社区户外能量场', activityType: 'offline', participants: 55, location: '深圳湾', startTime: '15:00', endTime: '18:00', description: '海边野餐+轻分享，欢迎带朋友', createdAt: '2026-05-30T10:00:00Z' },

  // June 2026（即将到来）
  { id: id(), date: '2026-06-03', title: '创意分享会第6期', activityType: 'creative', participants: 26, location: '深圳南山', startTime: '19:00', endTime: '21:00', description: '本期主题：AI 与创意表达', link: 'https://example.com/signup/202606', createdAt: '2026-05-20T10:00:00Z' },
  { id: id(), date: '2026-06-08', title: '出海产品共创冲刺', activityType: 'hackathon', participants: 44, location: '广州天河', startTime: '09:00', endTime: '20:00', link: 'https://example.com/hackathon', createdAt: '2026-05-22T10:00:00Z' },
  { id: id(), date: '2026-06-14', title: '湾区姐妹下午茶', activityType: 'offline', participants: 24, location: '香港中环', startTime: '15:00', endTime: '17:30', createdAt: '2026-05-23T10:00:00Z' },
  { id: id(), date: '2026-06-18', title: '投资人面对面', activityType: 'resource', participants: 20, location: '深圳福田', startTime: '14:00', endTime: '17:00', link: 'https://example.com/investor', createdAt: '2026-05-24T10:00:00Z' },
  { id: id(), date: '2026-06-26', title: '她说·演讲之夜', activityType: 'performance', participants: 75, location: '广州珠江新城', startTime: '19:30', endTime: '22:00', createdAt: '2026-05-25T10:00:00Z' },

  // July 2026
  { id: id(), date: '2026-07-04', title: '创意分享会第7期', activityType: 'creative', participants: 30, location: '深圳南山', startTime: '19:00', endTime: '21:00', createdAt: '2026-06-01T10:00:00Z' },
  { id: id(), date: '2026-07-12', title: '夏日共创训练营', activityType: 'member', participants: 38, location: '深圳福田', startTime: '10:00', endTime: '18:00', createdAt: '2026-06-02T10:00:00Z' },
  { id: id(), date: '2026-07-20', title: '资源对接闭门会', activityType: 'resource', participants: 16, location: '线上', startTime: '20:00', endTime: '21:30', createdAt: '2026-06-03T10:00:00Z' },
];
