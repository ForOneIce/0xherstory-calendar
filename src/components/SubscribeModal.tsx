import { useState } from 'react';
import { CalendarEvent } from '../types';
import { downloadICS } from '../ics';
import { X, CalendarPlus, Mail, Check, Loader, Bell, Download, AlertCircle } from 'lucide-react';

interface SubscribeModalProps {
  events: CalendarEvent[];
  year: number;
  organizerEmail: string;
  subscribeEndpoint: string;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SubscribeModal({
  events, year, organizerEmail, subscribeEndpoint, onClose,
}: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const upcoming = events
    .filter((e) => new Date(e.date + 'T23:59:59') >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date));

  function handleCalendarDownload() {
    downloadICS(events, `herstory-${year}.ics`);
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleEmailSubscribe() {
    if (!validEmail) {
      setStatus('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }
    // 优先使用配置的订阅端点（如 Formspree），否则回退到 mailto
    if (subscribeEndpoint) {
      setStatus('loading');
      setMessage('');
      try {
        const res = await fetch(subscribeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email,
            source: '0xHerstory Calendar',
            subscribedAt: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error('订阅请求失败');
        setStatus('success');
        setMessage('🎉 订阅成功！我们会通过邮件向妳推送活动信息。');
        setEmail('');
      } catch (err: any) {
        setStatus('error');
        setMessage(`订阅失败：${err.message}。妳也可以使用下方邮件方式订阅。`);
      }
    } else {
      // mailto 回退
      const to = organizerEmail || '';
      if (!to) {
        setStatus('error');
        setMessage('组织者尚未配置订阅邮箱，请先使用「加入日历」获取活动提醒。');
        return;
      }
      const subject = encodeURIComponent('[活动订阅] 0xHerstory Women的活动日历');
      const body = encodeURIComponent(
        `妳好，我希望订阅活动信息更新。\n\n我的邮箱：${email}\n\n（本邮件由活动日历站点自动生成）`
      );
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      setStatus('success');
      setMessage('已为妳打开邮件客户端，发送即可完成订阅 ✉️');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '2px solid rgba(219,39,119,0.25)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #831843 0%, #4c1d95 100%)' }}
        >
          <div className="flex items-center gap-2 text-white">
            <Bell size={20} />
            <h2 className="text-lg font-bold">订阅活动提醒</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-gray-500 leading-relaxed">
            不错过每一场共创活动 —— 把活动加入妳的日历获得<strong className="text-pink-600">系统提醒通知</strong>，或留下邮箱接收活动更新。
          </p>

          {/* 日历订阅 */}
          <div className="rounded-xl border border-pink-100 p-4" style={{ background: 'linear-gradient(135deg, #fdf2f8, #faf5ff)' }}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarPlus size={16} className="text-purple-600" />
              <h3 className="text-sm font-bold text-purple-800">加入我的日历（推荐）</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              下载 <code className="text-pink-600">.ics</code> 文件并导入 Google 日历 / Apple 日历 / Outlook。
              导入后将在活动<strong>前 1 天、前 1 小时</strong>自动提醒。
            </p>
            <button
              onClick={handleCalendarDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
            >
              <Download size={16} />
              下载日历文件（{events.length} 场活动）
            </button>
            {upcoming.length > 0 && (
              <p className="text-[11px] text-pink-500 mt-2 text-center">
                近期即将开始：{upcoming[0].title}（{upcoming[0].date}）
              </p>
            )}
          </div>

          {/* 邮箱订阅 */}
          <div className="rounded-xl border border-purple-100 p-4 bg-purple-50/40">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-pink-600" />
              <h3 className="text-sm font-bold text-purple-800">邮箱订阅活动信息</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setMessage(''); }}
                placeholder="you@example.com"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleEmailSubscribe}
                disabled={status === 'loading'}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-1"
                style={{ background: 'linear-gradient(135deg, #831843, #4c1d95)' }}
              >
                {status === 'loading' ? <Loader size={14} className="animate-spin" /> : <Mail size={14} />}
                订阅
              </button>
            </div>
            {message && (
              <div className={`mt-2 text-xs flex items-start gap-1 ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {status === 'error' ? <AlertCircle size={14} className="shrink-0 mt-0.5" /> : <Check size={14} className="shrink-0 mt-0.5" />}
                <span>{message}</span>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              {subscribeEndpoint
                ? '订阅信息将提交给活动组织者，用于推送活动更新。'
                : '提交后将通过邮件方式将妳的订阅请求发送给组织者。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
