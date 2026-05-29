import { CalendarEvent, ACTIVITY_TYPES, HEAT_COLORS, getHeatLevel } from '../types';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useState } from 'react';
import { generateShareText, copyToClipboard } from '../share';

interface MonthViewProps {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return (d + 6) % 7; // Mon=0
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MonthView({ year, month, events, onDayClick, onMonthChange }: MonthViewProps) {
  const [shareMsg, setShareMsg] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthEvents = events.filter((e) => e.date.startsWith(monthStr));

  const eventMap: Record<string, CalendarEvent[]> = {};
  monthEvents.forEach((e) => {
    if (!eventMap[e.date]) eventMap[e.date] = [];
    eventMap[e.date].push(e);
  });

  const today = new Date().toISOString().slice(0, 10);

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  async function handleShare() {
    const text = generateShareText('month', monthEvents, monthStr);
    await copyToClipboard(text);
    setShareMsg('已复制！');
    setTimeout(() => setShareMsg(''), 2000);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white/90 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(219,39,119,0.15)' }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)' }}
      >
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-pink-100 text-purple-700 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-base font-bold text-purple-900">{year}年{MONTH_NAMES[month - 1]}</div>
          <div className="text-xs text-pink-500">{monthEvents.length} 场活动</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-pink-600 hover:bg-pink-100 transition-colors font-semibold"
          >
            <Share2 size={12} />
            {shareMsg || '分享'}
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-pink-100 text-purple-700 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-pink-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-purple-600">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const date = day ? formatDate(year, month, day) : null;
          const dayEvents = date ? eventMap[date] || [] : [];
          const totalP = dayEvents.reduce((s, e) => s + e.participants, 0);
          const level = getHeatLevel(totalP);
          const bg = dayEvents.length > 0 ? HEAT_COLORS[level] : 'transparent';
          const isToday = date === today;

          return (
            <div
              key={idx}
              onClick={() => day && date && onDayClick(date)}
              className={`min-h-[72px] p-1.5 border-b border-r border-pink-50 relative
                ${day ? 'cursor-pointer hover:bg-pink-50 transition-colors' : ''}
                ${isToday ? 'ring-2 ring-pink-400 ring-inset' : ''}
              `}
              style={{ backgroundColor: dayEvents.length > 0 ? bg + '44' : undefined }}
            >
              {day && (
                <>
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white' : 'text-gray-700'}
                  `}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="text-[9px] rounded px-1 py-0.5 truncate leading-tight"
                        style={{
                          backgroundColor: ACTIVITY_TYPES[e.activityType]?.color + '33',
                          color: '#7c3aed',
                        }}
                      >
                        {ACTIVITY_TYPES[e.activityType]?.icon} {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-pink-500 font-semibold">+{dayEvents.length - 2}更多</div>
                    )}
                  </div>
                  {dayEvents.length > 0 && (
                    <div
                      className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', fontSize: '8px' }}
                    >
                      {totalP}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
