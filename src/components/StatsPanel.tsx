import { CalendarEvent, ACTIVITY_TYPES, HEAT_COLORS } from '../types';
import { Users, Zap, Globe, Star } from 'lucide-react';

interface StatsPanelProps {
  events: CalendarEvent[];
  year: number;
}

export default function StatsPanel({ events, year }: StatsPanelProps) {
  const yearEvents = events.filter((e) => e.date.startsWith(String(year)));
  const totalParticipants = yearEvents.reduce((s, e) => s + e.participants, 0);
  const byType: Record<string, number> = {};
  yearEvents.forEach((e) => {
    byType[e.activityType] = (byType[e.activityType] || 0) + 1;
  });

  const activeDays = new Set(yearEvents.map((e) => e.date)).size;

  return (
    <div className="space-y-6">
      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Users size={20} />, value: `${totalParticipants}+`, label: '姐妹共创', color: 'text-pink-600', bg: 'bg-pink-50' },
          { icon: <Zap size={20} />, value: `${yearEvents.length}+`, label: '活动场次', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: <Globe size={20} />, value: `${activeDays}`, label: '活跃天数', color: 'text-pink-500', bg: 'bg-pink-50' },
          { icon: <Star size={20} />, value: '100%', label: '她的舞台', color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-4 text-center`}>
            <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white/80 rounded-2xl p-4" style={{ border: '1px solid rgba(219,39,119,0.15)' }}>
        <h3 className="text-sm font-bold text-purple-800 mb-3">活动类型图例</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(ACTIVITY_TYPES).map(([type, info]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className="text-base">{info.icon}</span>
              <span className="text-gray-600">{info.label}</span>
            </div>
          ))}
        </div>

        {/* Heat legend */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">能量值：低</span>
          <div className="flex gap-1">
            {HEAT_COLORS.slice(1).map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded"
                style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.08)' }}
                title={['1-5人', '6-15人', '16-30人', '31-60人', '60人+'][i]}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">高</span>
          <div className="ml-2 text-xs text-gray-400 hidden sm:block">
            | 1-5人 · 6-15人 · 16-30人 · 31-60人 · 60人+
          </div>
        </div>
      </div>

      {/* Activity breakdown */}
      {yearEvents.length > 0 && (
        <div className="bg-white/80 rounded-2xl p-4" style={{ border: '1px solid rgba(219,39,119,0.15)' }}>
          <h3 className="text-sm font-bold text-purple-800 mb-3">活动类型分布</h3>
          <div className="space-y-2">
            {Object.entries(byType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
              const info = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
              const pct = Math.round((count / yearEvents.length) * 100);
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-sm w-6">{info.icon}</span>
                  <span className="text-xs text-gray-600 w-28 truncate">{info.label}</span>
                  <div className="flex-1 bg-pink-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-purple-700 font-bold w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
