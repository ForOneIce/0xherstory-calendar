import { useState, useEffect } from 'react';
import { CalendarEvent, ActivityType, ACTIVITY_TYPES, getHeatLevel } from '../types';
import { X, Calendar, Users, MapPin, FileText, Sparkles, Clock, Link as LinkIcon } from 'lucide-react';

interface AddEventModalProps {
  initialDate?: string;
  event?: CalendarEvent | null;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function AddEventModal({ initialDate, event, onSave, onDelete, onClose }: AddEventModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(event?.date || initialDate || today);
  const [title, setTitle] = useState(event?.title || '');
  const [activityType, setActivityType] = useState<ActivityType>(event?.activityType || 'creative');
  const [participants, setParticipants] = useState(event?.participants || 10);
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [link, setLink] = useState(event?.link || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!date) errs.date = '请选择日期';
    if (!title.trim()) errs.title = '请输入活动名称';
    if (participants < 0) errs.participants = '参与人数不能为负数';
    if (endTime && startTime && endTime < startTime) errs.endTime = '结束时间不能早于开始时间';
    if (link && !/^https?:\/\//.test(link)) errs.link = '链接需以 http:// 或 https:// 开头';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      date,
      title: title.trim(),
      activityType,
      participants,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      link: link.trim() || undefined,
    });
  }

  const selectedType = ACTIVITY_TYPES[activityType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '2px solid rgba(219,39,119,0.2)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-pink-500" />
            <h2 className="text-lg font-bold text-purple-900">
              {event ? '编辑活动' : '添加新活动'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-pink-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-2">活动类型</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ACTIVITY_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setActivityType(type as ActivityType)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs transition-all ${
                    activityType === type
                      ? 'border-pink-500 bg-pink-50 text-pink-700 font-semibold shadow-md'
                      : 'border-gray-200 hover:border-pink-300 text-gray-600'
                  }`}
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-center leading-tight">{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <Calendar size={14} /> 日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                errors.date ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Time（选填，用于日历提醒） */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <Clock size={14} /> 时间（选填，用于精准日历提醒）
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <span className="text-gray-400 text-sm">至</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 ${errors.endTime ? 'border-red-400' : 'border-gray-200'}`}
              />
            </div>
            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            <p className="text-[11px] text-gray-400 mt-1">不填则按全天活动处理</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">活动名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`例：${selectedType.label}第X期`}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                errors.title ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <Users size={14} /> 参与人数
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={200}
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value))}
                className="flex-1 accent-pink-500"
              />
              <input
                type="number"
                min={1}
                max={9999}
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
                className="w-20 border border-gray-200 rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            {/* Heat preview */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>热度：</span>
              {[1,2,3,4,5].map((level) => (
                <div
                  key={level}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: level <= getHeatLevel(participants) ? '#a855f7' : '#f3f4f6' }}
                />
              ))}
              <span className="text-pink-600 font-medium">
                {participants <= 5 ? '小型' : participants <= 15 ? '中型' : participants <= 30 ? '大型' : participants <= 60 ? '超大' : '盛会'}
              </span>
            </div>
          </div>

          {/* Link（选填） */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <LinkIcon size={14} /> 报名/详情链接（选填）
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 ${errors.link ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <MapPin size={14} /> 地点（选填）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="活动地点"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1">
              <FileText size={14} /> 简介（选填）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="活动简介..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {event && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors"
            >
              删除
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
          >
            {event ? '保存修改' : '添加活动'}
          </button>
        </div>
      </div>
    </div>
  );
}
