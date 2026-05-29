import { CalendarEvent, ACTIVITY_TYPES, getHeatLevel, HEAT_COLORS } from '../types';
import { X, Plus, Share2, Users, MapPin, Clock, CalendarPlus, ExternalLink } from 'lucide-react';
import { generateShareText, copyToClipboard } from '../share';
import { downloadICS, googleCalendarUrl } from '../ics';
import { useState } from 'react';

interface DayDetailModalProps {
  date: string;
  events: CalendarEvent[];
  canEdit: boolean;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onShare: () => void;
  onClose: () => void;
}

export default function DayDetailModal({
  date, events, canEdit, onAddEvent, onEditEvent, onShare, onClose
}: DayDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const totalParticipants = events.reduce((s, e) => s + e.participants, 0);

  async function handleShare() {
    const text = generateShareText('day', events, date);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShare();
  }

  const displayDate = new Date(date + 'T00:00:00');
  const dateLabel = displayDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '2px solid rgba(219,39,119,0.2)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-purple-900">{dateLabel}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-pink-100 text-gray-500">
              <X size={20} />
            </button>
          </div>
          {events.length > 0 && (
            <p className="text-sm text-pink-600">{events.length} 场活动 · {totalParticipants} 人次参与</p>
          )}
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-sm">这一天还没有活动</p>
              <p className="text-xs text-pink-400 mt-1">点亮每一天！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const typeInfo = ACTIVITY_TYPES[event.activityType];
                const level = getHeatLevel(event.participants);
                const color = HEAT_COLORS[level];
                return (
                  <div
                    key={event.id}
                    className="rounded-xl p-3 transition-all border"
                    style={{ borderColor: 'rgba(219,39,119,0.2)', backgroundColor: color + '22' }}
                  >
                    <div
                      className={`flex items-start gap-2 ${canEdit ? 'cursor-pointer' : ''}`}
                      onClick={() => canEdit && onEditEvent(event)}
                    >
                      <span className="text-xl mt-0.5">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-purple-900 text-sm truncate">{event.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{typeInfo.label}</div>
                        {event.startTime && (
                          <div className="flex items-center gap-1 text-xs text-purple-500 mt-1">
                            <Clock size={10} />
                            {event.startTime}{event.endTime ? `–${event.endTime}` : ''}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin size={10} />
                            {event.location}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-pink-600 text-xs font-bold shrink-0">
                        <Users size={12} />
                        {event.participants}
                      </div>
                    </div>
                    {/* 参与者操作：加入日历 / 报名 */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-pink-100/60">
                      <a
                        href={googleCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-semibold"
                      >
                        <CalendarPlus size={12} /> Google日历
                      </a>
                      <button
                        onClick={() => downloadICS([event], `${event.title}.ics`)}
                        className="flex items-center gap-1 text-[11px] text-pink-600 hover:text-pink-800 font-semibold"
                      >
                        <CalendarPlus size={12} /> .ics
                      </button>
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-pink-600 font-semibold ml-auto"
                        >
                          <ExternalLink size={12} /> 报名/详情
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border-2 border-pink-200 text-pink-600 hover:bg-pink-50 text-sm font-semibold transition-colors"
          >
            <Share2 size={14} />
            {copied ? '已复制！' : '分享当日'}
          </button>
          {events.length > 0 && (
            <button
              onClick={() => downloadICS(events, `herstory-${date}.ics`)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 text-sm font-semibold transition-colors"
            >
              <CalendarPlus size={14} />
              加入日历
            </button>
          )}
          {canEdit && (
            <button
              onClick={onAddEvent}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
            >
              <Plus size={14} />
              添加活动
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
