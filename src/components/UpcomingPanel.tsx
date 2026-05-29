import { CalendarEvent, ACTIVITY_TYPES } from '../types';
import { Bell, Clock, MapPin, CalendarPlus } from 'lucide-react';
import { googleCalendarUrl } from '../ics';

interface UpcomingPanelProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSubscribe: () => void;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function relativeLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return '今天';
  if (d === 1) return '明天';
  if (d === 2) return '后天';
  if (d <= 7) return `${d}天后`;
  return `${dateStr.slice(5)}`;
}

export default function UpcomingPanel({ events, onEventClick, onSubscribe }: UpcomingPanelProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((e) => {
      const [y, m, d] = e.date.split('-').map(Number);
      return new Date(y, m - 1, d).getTime() >= today.getTime();
    })
    .sort((a, b) => (a.date === b.date ? (a.startTime || '').localeCompare(b.startTime || '') : a.date.localeCompare(b.date)))
    .slice(0, 4);

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{ background: 'linear-gradient(135deg, #fff 0%, #fdf2f8 100%)', border: '1px solid rgba(219,39,119,0.2)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-purple-800 flex items-center gap-1">
          <Bell size={14} className="text-pink-500" />
          近期活动
        </h3>
        <button
          onClick={onSubscribe}
          className="text-[11px] font-semibold text-pink-600 hover:text-pink-800 flex items-center gap-1"
        >
          <CalendarPlus size={12} /> 订阅提醒
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-1">🌱</div>
          <p className="text-xs text-gray-400">暂无即将到来的活动</p>
          <button onClick={onSubscribe} className="text-xs text-pink-500 font-semibold mt-2 hover:underline">
            订阅以便第一时间收到通知
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => {
            const type = ACTIVITY_TYPES[e.activityType];
            const rel = relativeLabel(e.date);
            const isSoon = daysUntil(e.date) <= 2;
            return (
              <div
                key={e.id}
                className="rounded-xl p-2.5 border border-pink-100 hover:border-pink-300 hover:shadow-sm transition-all cursor-pointer bg-white/70"
                onClick={() => onEventClick(e)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{type?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSoon ? 'text-white' : 'text-pink-600 bg-pink-100'}`}
                        style={isSoon ? { background: 'linear-gradient(135deg, #ec4899, #a855f7)' } : undefined}
                      >
                        {rel}
                      </span>
                      <span className="text-[10px] text-gray-400">{e.date}</span>
                    </div>
                    <div className="font-semibold text-purple-900 text-xs mt-1 truncate">{e.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      {e.startTime && (
                        <span className="flex items-center gap-0.5"><Clock size={9} />{e.startTime}</span>
                      )}
                      {e.location && (
                        <span className="flex items-center gap-0.5 truncate"><MapPin size={9} />{e.location}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={googleCalendarUrl(e)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(ev) => ev.stopPropagation()}
                    title="加入日历"
                    className="shrink-0 p-1 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <CalendarPlus size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
