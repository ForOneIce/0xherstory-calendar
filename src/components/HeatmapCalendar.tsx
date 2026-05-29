import { useMemo, useState } from 'react';
import { CalendarEvent, ACTIVITY_TYPES, HEAT_COLORS, getHeatLevel } from '../types';

interface HeatmapCalendarProps {
  year: number;
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const MONTHS = [
  { label: '1月 Jan', short: 1 }, { label: '2月 Feb', short: 2 },
  { label: '3月 Mar', short: 3 }, { label: '4月 Apr', short: 4 },
  { label: '5月 May', short: 5 }, { label: '6月 Jun', short: 6 },
  { label: '7月 Jul', short: 7 }, { label: '8月 Aug', short: 8 },
  { label: '9月 Sep', short: 9 }, { label: '10月 Oct', short: 10 },
  { label: '11月 Nov', short: 11 }, { label: '12月 Dec', short: 12 },
];

const WEEK_DAYS = [
  { en: 'MON', zh: '周一' }, { en: 'TUE', zh: '周二' },
  { en: 'WED', zh: '周三' }, { en: 'THU', zh: '周四' },
  { en: 'FRI', zh: '周五' }, { en: 'SAT', zh: '周六' },
  { en: 'SUN', zh: '周日' },
];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getDayOfWeek(date: Date): number {
  // 0=Mon, 6=Sun
  return (date.getDay() + 6) % 7;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function HeatmapCalendar({ year, events, onDayClick, onEventClick }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; events: CalendarEvent[] } | null>(null);

  // Build event map: date -> events
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  // Build grid: week columns, each with 7 day slots (Mon-Sun)
  // Each column = one ISO week
  const grid = useMemo(() => {
    // Find all weeks for the year
    const weeks: { weekNum: number; days: { date: string | null; dayOfWeek: number }[] }[] = [];
    const weekMap: Record<number, { date: string; dayOfWeek: number }[]> = {};

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weekNum = getWeekNumber(d);
      const dayOfWeek = getDayOfWeek(d);
      const dateStr = formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (!weekMap[weekNum]) weekMap[weekNum] = [];
      weekMap[weekNum].push({ date: dateStr, dayOfWeek });
    }

    const weekNums = Object.keys(weekMap).map(Number).sort((a, b) => a - b);
    weekNums.forEach((wn) => {
      const days: { date: string | null; dayOfWeek: number }[] = Array(7).fill(null).map((_, i) => ({ date: null, dayOfWeek: i }));
      weekMap[wn].forEach((d) => {
        days[d.dayOfWeek] = { date: d.date, dayOfWeek: d.dayOfWeek };
      });
      weeks.push({ weekNum: wn, days });
    });

    return weeks;
  }, [year]);

  // Month column spans
  const monthSpans = useMemo(() => {
    const spans: { month: number; label: string; startCol: number; endCol: number }[] = [];
    MONTHS.forEach(({ short: m, label }) => {
      const weekNums = new Set<number>();
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, m - 1, d);
        weekNums.add(getWeekNumber(date));
      }
      const sortedWeeks = Array.from(weekNums).sort((a, b) => a - b);
      const startCol = grid.findIndex((w) => w.weekNum === sortedWeeks[0]);
      const endCol = grid.findIndex((w) => w.weekNum === sortedWeeks[sortedWeeks.length - 1]);
      if (startCol !== -1) {
        spans.push({ month: m, label, startCol, endCol });
      }
    });
    return spans;
  }, [year, grid]);

  const cellSize = 28; // px
  const labelWidth = 64; // px for day labels

  function getCellColor(date: string | null): string {
    if (!date) return 'transparent';
    const evs = eventMap[date];
    if (!evs || evs.length === 0) return '#fdf2f8';
    const totalParticipants = evs.reduce((s, e) => s + e.participants, 0);
    const level = getHeatLevel(totalParticipants);
    return HEAT_COLORS[level];
  }

  function getCellIcons(date: string | null): string[] {
    if (!date) return [];
    const evs = eventMap[date];
    if (!evs || evs.length === 0) return [];
    // Show up to 2 icons
    return evs.slice(0, 2).map((e) => ACTIVITY_TYPES[e.activityType]?.icon || '');
  }

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: labelWidth + grid.length * (cellSize + 2) + 'px' }}>
        {/* Month headers */}
        <div className="flex mb-1" style={{ paddingLeft: labelWidth + 'px' }}>
          {monthSpans.map(({ month, label, startCol, endCol }) => {
            const w = (endCol - startCol + 1) * (cellSize + 2);
            return (
              <div
                key={month}
                style={{ width: w + 'px', flexShrink: 0 }}
                className="text-center text-xs font-bold text-purple-800 truncate px-1"
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Week number row */}
        <div className="flex mb-1" style={{ paddingLeft: labelWidth + 'px' }}>
          {grid.map(({ weekNum }) => (
            <div
              key={weekNum}
              style={{ width: cellSize + 2 + 'px', flexShrink: 0 }}
              className="text-center text-[9px] text-pink-300"
            >
              {weekNum}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {WEEK_DAYS.map(({ en, zh }, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-[2px]">
            {/* Day label */}
            <div
              style={{ width: labelWidth + 'px', flexShrink: 0 }}
              className="text-right pr-2 text-xs text-purple-800 font-semibold"
            >
              <span className="text-[11px] font-bold">{en}</span>
              <span className="text-[9px] text-pink-400 ml-1">{zh}</span>
            </div>

            {/* Cells */}
            {grid.map(({ weekNum, days }) => {
              const cell = days[dayIdx];
              const date = cell?.date || null;
              const bg = getCellColor(date);
              const icons = date ? getCellIcons(date) : [];
              const hasEvent = date && eventMap[date] && eventMap[date].length > 0;

              return (
                <div
                  key={weekNum}
                  style={{
                    width: cellSize + 'px',
                    height: cellSize + 'px',
                    marginRight: '2px',
                    backgroundColor: date ? bg : 'transparent',
                    cursor: date ? 'pointer' : 'default',
                    borderRadius: '4px',
                    border: date ? '1px solid rgba(219,39,119,0.15)' : 'none',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    position: 'relative',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                  onClick={() => {
                    if (date) {
                      if (hasEvent && eventMap[date].length === 1) {
                        onEventClick(eventMap[date][0]);
                      } else {
                        onDayClick(date);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (date && eventMap[date]) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTooltip({ x: rect.left, y: rect.bottom + 4, date, events: eventMap[date] });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  title={date || ''}
                  className={`hover:scale-110 hover:shadow-lg hover:z-10 ${date ? 'hover:border-pink-400' : ''}`}
                >
                  {hasEvent && icons.length > 0 && (
                    <span style={{ fontSize: icons.length > 1 ? '9px' : '12px', filter: 'brightness(0) invert(1)' }}>
                      {icons.join('')}
                    </span>
                  )}
                  {date && !hasEvent && (
                    <span style={{ fontSize: '7px', color: '#f9a8d4', opacity: 0.6 }}>·</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1000,
            maxWidth: '200px',
          }}
          className="bg-white border border-pink-200 rounded-lg shadow-xl p-2 text-xs pointer-events-none"
        >
          <div className="font-bold text-purple-800 mb-1">{tooltip.date}</div>
          {tooltip.events.map((e) => (
            <div key={e.id} className="flex items-center gap-1 text-gray-700">
              <span>{ACTIVITY_TYPES[e.activityType]?.icon}</span>
              <span className="truncate">{e.title}</span>
              <span className="text-pink-500 ml-auto">{e.participants}人</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
