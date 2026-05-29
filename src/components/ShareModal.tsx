import { useState } from 'react';
import { CalendarEvent } from '../types';
import { generateShareText, copyToClipboard, downloadJSON, ShareScope } from '../share';
import { X, Copy, Download, Share2, Check, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

// Silence unused import warning
void Calendar;

interface ShareModalProps {
  scope: ShareScope;
  events: CalendarEvent[];
  date?: string;      // YYYY-MM or YYYY-MM-DD
  year?: number;
  event?: CalendarEvent;
  onClose: () => void;
}

const SCOPE_LABELS: Record<ShareScope, { label: string; icon: React.ReactNode }> = {
  event: { label: '单活动分享', icon: <Calendar size={16} /> },
  day: { label: '单日分享', icon: <CalendarDays size={16} /> },
  month: { label: '单月分享', icon: <CalendarRange size={16} /> },
  year: { label: '全年分享', icon: <Share2 size={16} /> },
};

export default function ShareModal({ scope, events, date, year, event, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const targetEvents = event ? [event] : events;
  const text = generateShareText(scope, targetEvents, date, year);

  async function handleCopy() {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    setDownloading(true);
    const label = scope === 'year' ? `${year}年` : scope === 'month' ? date?.replace('-', '年') + '月' : date || 'events';
    downloadJSON(targetEvents, `herstory-${label}.json`);
    setTimeout(() => setDownloading(false), 1000);
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({
        title: '0xHerstory · Women的2026',
        text,
      }).catch(() => {});
    }
  }

  const scopeInfo = SCOPE_LABELS[scope];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '2px solid rgba(168,85,247,0.3)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
        >
          <div className="flex items-center gap-2 text-purple-800">
            {scopeInfo.icon}
            <h2 className="text-lg font-bold">{scopeInfo.label}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Preview text */}
          <div
            className="rounded-xl p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 100%)', border: '1px solid rgba(219,39,119,0.15)' }}
          >
            {text}
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4 text-center">
            <div className="flex-1 bg-pink-50 rounded-xl p-3">
              <div className="text-xl font-bold text-pink-600">{targetEvents.length}</div>
              <div className="text-xs text-gray-500">场活动</div>
            </div>
            <div className="flex-1 bg-purple-50 rounded-xl p-3">
              <div className="text-xl font-bold text-purple-600">
                {targetEvents.reduce((s, e) => s + e.participants, 0)}
              </div>
              <div className="text-xs text-gray-500">人次参与</div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-pink-200 text-pink-700 hover:bg-pink-50 font-semibold text-sm transition-all"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? '已复制！' : '复制文本'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-sm transition-all"
            >
              <Download size={16} />
              {downloading ? '导出中...' : '导出JSON'}
            </button>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
            >
              <Share2 size={16} />
              系统分享
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
