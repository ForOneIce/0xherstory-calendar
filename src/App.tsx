import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from './store';
import { CalendarEvent, ACTIVITY_TYPES, CalendarDataFile } from './types';
import HeatmapCalendar from './components/HeatmapCalendar';
import MonthView from './components/MonthView';
import AddEventModal from './components/AddEventModal';
import DayDetailModal from './components/DayDetailModal';
import ShareModal from './components/ShareModal';
import GithubBackupModal from './components/GithubBackupModal';
import SubscribeModal from './components/SubscribeModal';
import StatsPanel from './components/StatsPanel';
import UpcomingPanel from './components/UpcomingPanel';
import { ShareScope, downloadJSON } from './share';
import { fetchPublicData } from './github';
import {
  Plus, Share2, Upload, ChevronLeft, ChevronRight,
  LayoutGrid, CalendarDays, List, X, Menu, Bell, ShieldCheck, RefreshCw, Eye,
} from 'lucide-react';

type ViewMode = 'heatmap' | 'month' | 'list';
type ModalType = 'add' | 'day' | 'share' | 'github' | 'eventEdit' | 'subscribe' | null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 从 URL 解析公开数据源：?source=owner/repo 或 owner/repo/branch
function parseSourceParam(): { owner: string; repo: string; branch?: string } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('source') || params.get('data');
    if (!s) return null;
    const parts = s.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1], branch: parts[2] };
  } catch {
    return null;
  }
}

export default function App() {
  const {
    events, currentYear, githubToken, githubOwner, githubRepo, githubBranch,
    lastBackupAt, isAdmin, organizerEmail, subscribeEndpoint,
    addEvent, updateEvent, deleteEvent, setCurrentYear,
    setGithubConfig, setSubscribeConfig, setLastBackupAt, setLastSyncedAt, setAdmin,
    importEvents, loadPublishedData,
  } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [shareScope, setShareScope] = useState<ShareScope>('year');
  const [shareEvents, setShareEvents] = useState<CalendarEvent[]>([]);
  const [shareDate, setShareDate] = useState<string | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [toast, setToast] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

  const yearEvents = events.filter((e) => e.date.startsWith(String(currentYear)));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // 解析数据源（URL 优先），用于公开读取
  const resolveSource = useCallback(() => {
    const fromUrl = parseSourceParam();
    if (fromUrl) return fromUrl;
    if (githubOwner && githubRepo) return { owner: githubOwner, repo: githubRepo, branch: githubBranch };
    return null;
  }, [githubOwner, githubRepo, githubBranch]);

  const applyPublished = useCallback((data: CalendarDataFile) => {
    loadPublishedData({
      events: data.events,
      organizerEmail: data.organizerEmail,
      subscribeEndpoint: data.subscribeEndpoint,
    });
    setLastSyncedAt(new Date().toISOString());
  }, [loadPublishedData, setLastSyncedAt]);

  // 启动时自动从公开仓库加载数据
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 若 URL 带 source，持久化为站点默认源（便于分享链接）
    const fromUrl = parseSourceParam();
    if (fromUrl) {
      setGithubConfig({
        token: githubToken,
        owner: fromUrl.owner,
        repo: fromUrl.repo,
        branch: fromUrl.branch || 'main',
      });
    }

    const src = fromUrl || (githubOwner && githubRepo ? { owner: githubOwner, repo: githubRepo, branch: githubBranch } : null);
    if (!src) return;

    setSyncState('loading');
    fetchPublicData(src)
      .then((data) => {
        if (!data || data.events.length === 0) {
          setSyncState('idle');
          return;
        }
        if (isAdmin) {
          // 管理员：不自动覆盖本地编辑，提示可手动拉取
          setSyncState('done');
          showToast('云端已有最新数据，可在管理后台「从GitHub拉取」');
        } else {
          applyPublished(data);
          setSyncState('done');
        }
      })
      .catch(() => setSyncState('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    const src = resolveSource();
    if (!src) {
      showToast('尚未配置数据源');
      return;
    }
    setSyncState('loading');
    const data = await fetchPublicData(src);
    if (data && data.events.length >= 0) {
      applyPublished(data);
      setSyncState('done');
      showToast(`已刷新：${data.events.length} 场活动`);
    } else {
      setSyncState('error');
      showToast('刷新失败，请稍后再试');
    }
  }

  function closeModal() {
    setActiveModal(null);
    setSelectedDate(null);
    setSelectedEvent(null);
  }

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(date);
    setActiveModal('day');
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (isAdmin) {
      setSelectedEvent(event);
      setActiveModal('eventEdit');
    } else {
      setSelectedDate(event.date);
      setActiveModal('day');
    }
  }, [isAdmin]);

  function openAddEvent(date?: string) {
    setSelectedDate(date || null);
    setSelectedEvent(null);
    setActiveModal('add');
  }

  function openShare(scope: ShareScope, evs: CalendarEvent[], date?: string) {
    setShareScope(scope);
    setShareEvents(evs);
    setShareDate(date);
    setActiveModal('share');
  }

  function handleSaveEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>) {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, data);
    } else {
      addEvent({ ...data, id: generateId(), createdAt: new Date().toISOString() });
    }
    closeModal();
  }

  function handleDeleteEvent() {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
    }
    closeModal();
  }

  const dayEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 30%, #fce7f3 60%, #fdf2f8 100%)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 shadow-sm backdrop-blur-md"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)', borderBottom: '1px solid rgba(219,39,119,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
              >
                0x
              </div>
              <div>
                <div className="font-black text-purple-900 text-sm leading-tight">0xHerstory</div>
                <div className="text-[10px] text-pink-500 font-semibold">大湾区分部 · BAY AREA</div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-pink-200 mx-1" />
              <div className="hidden sm:block">
                <span className="text-lg font-black text-purple-900">Women的{currentYear}</span>
                <span className="ml-2 text-xs text-pink-500">湾区通四海，有她有未来</span>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Year navigation */}
              <div className="flex items-center gap-1 bg-pink-50 rounded-xl px-2 py-1">
                <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1 hover:text-pink-600 text-gray-500 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-purple-800 w-12 text-center">{currentYear}</span>
                <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1 hover:text-pink-600 text-gray-500 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* View mode */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                {([['heatmap', <LayoutGrid size={14} />, '热力图'], ['month', <CalendarDays size={14} />, '月视图'], ['list', <List size={14} />, '列表']] as const).map(([mode, icon, label]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === mode
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* 刷新数据 */}
              <button
                onClick={handleRefresh}
                title="从云端刷新活动数据"
                className="p-2 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors"
              >
                <RefreshCw size={14} className={syncState === 'loading' ? 'animate-spin' : ''} />
              </button>

              {/* 订阅提醒 */}
              <button
                onClick={() => setActiveModal('subscribe')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 text-sm font-semibold transition-colors"
              >
                <Bell size={14} />
                订阅提醒
              </button>

              {/* 管理后台 */}
              <button
                onClick={() => setActiveModal('github')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-sm font-bold transition-all hover:shadow-md hover:scale-105"
                style={{ background: isAdmin ? 'linear-gradient(135deg, #166534, #15803d)' : 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }}
              >
                {isAdmin ? <ShieldCheck size={14} /> : <Eye size={14} />}
                {isAdmin ? '管理中' : '管理'}
              </button>

              {isAdmin && (
                <button
                  onClick={() => openAddEvent()}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-sm font-bold transition-all hover:shadow-md hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                >
                  <Plus size={16} />
                  添加活动
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-xl hover:bg-pink-50 text-purple-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden pt-3 pb-1 border-t border-pink-100 mt-3 space-y-2">
              <div className="text-sm font-black text-purple-900 mb-2">Women的{currentYear} · 湾区通四海</div>
              <div className="flex items-center gap-1 mb-2">
                <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1.5 rounded-lg bg-pink-50 text-purple-700">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-purple-800 px-2">{currentYear}年</span>
                <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1.5 rounded-lg bg-pink-50 text-purple-700">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActiveModal('subscribe'); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-pink-200 text-pink-600 text-sm font-semibold">
                  <Bell size={14} /> 订阅
                </button>
                <button onClick={() => { openShare('year', yearEvents); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-pink-200 text-pink-600 text-sm font-semibold">
                  <Share2 size={14} /> 分享
                </button>
                <button onClick={() => { setActiveModal('github'); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-white text-sm font-bold"
                  style={{ background: isAdmin ? 'linear-gradient(135deg, #166534, #15803d)' : 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }}>
                  {isAdmin ? '管理中' : '管理'}
                </button>
              </div>
              {isAdmin && (
                <button onClick={() => { openAddEvent(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
                  <Plus size={14} /> 添加活动
                </button>
              )}
              <div className="flex gap-1 pt-1">
                {([['heatmap', '热力图'], ['month', '月视图'], ['list', '列表']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => { setViewMode(mode); setMobileMenuOpen(false); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${viewMode === mode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero banner */}
        <div
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #831843 0%, #4c1d95 50%, #1e1b4b 100%)' }}
        >
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-white text-2xl animate-pulse"
                style={{
                  left: `${(i * 17.3) % 100}%`,
                  top: `${(i * 23.7) % 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + (i % 3)}s`,
                }}
              >
                {['✨', '💜', '⚡', '🌸', '👑'][i % 5]}
              </div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Women的<span className="text-pink-300">{currentYear}</span>
                </h1>
                <p className="text-pink-200 text-sm mt-1">我们的 Herstory，由每一天的共创点亮</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  {['💡 创意无界', '🤝 分享互利', '⭐ 共创共赢', '👑 推妳站上更大的舞台'].map((tag) => (
                    <span key={tag} className="bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white">{yearEvents.length}</div>
                <div className="text-pink-300 text-sm">场共创活动</div>
                <div className="text-2xl font-bold text-pink-200 mt-1">
                  {yearEvents.reduce((s, e) => s + e.participants, 0)}
                </div>
                <div className="text-pink-300 text-xs">人次参与</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar main area */}
          <div className="lg:col-span-3">
            {viewMode === 'heatmap' && (
              <div
                ref={calendarRef}
                className="bg-white/90 rounded-3xl p-4 sm:p-6 shadow-lg"
                style={{ border: '1px solid rgba(219,39,119,0.15)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-black text-purple-900">{currentYear} 共创热力图</h2>
                    <p className="text-xs text-pink-400 mt-0.5">我们一起走过的每一天，都算数。</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openShare('year', yearEvents, undefined)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 text-xs font-semibold"
                    >
                      <Share2 size={12} />
                      分享年历
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openAddEvent()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                      >
                        <Plus size={12} />
                        添加
                      </button>
                    )}
                  </div>
                </div>
                <HeatmapCalendar
                  year={currentYear}
                  events={events}
                  onDayClick={handleDayClick}
                  onEventClick={handleEventClick}
                />
              </div>
            )}

            {viewMode === 'month' && (
              <div className="space-y-4">
                <MonthView
                  year={currentMonth.year}
                  month={currentMonth.month}
                  events={events}
                  onDayClick={handleDayClick}
                  onMonthChange={(y, m) => setCurrentMonth({ year: y, month: m })}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      const monthStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`;
                      const monthEvs = events.filter((e) => e.date.startsWith(monthStr));
                      openShare('month', monthEvs, monthStr);
                    }}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 text-sm font-semibold"
                  >
                    <Share2 size={14} />
                    分享本月
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => openAddEvent(`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                    >
                      <Plus size={14} />
                      添加活动
                    </button>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'list' && (
              <div
                className="bg-white/90 rounded-3xl p-4 sm:p-6 shadow-lg"
                style={{ border: '1px solid rgba(219,39,119,0.15)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-purple-900">{currentYear} 活动列表</h2>
                  {isAdmin && (
                    <button
                      onClick={() => openAddEvent()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                    >
                      <Plus size={12} />
                      添加
                    </button>
                  )}
                </div>
                {yearEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">✨</div>
                    <p className="text-gray-400 text-sm">还没有活动{isAdmin ? '，点击添加第一个！' : '，敬请期待～'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...yearEvents].sort((a, b) => b.date.localeCompare(a.date)).map((event) => {
                      const typeInfo = ACTIVITY_TYPES[event.activityType];
                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-xl border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
                          style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 100%)' }}
                          onClick={() => handleEventClick(event)}
                        >
                          <span className="text-xl mt-0.5">{typeInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-purple-900 text-sm">{event.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {event.date}{event.startTime ? ` ${event.startTime}` : ''} · {typeInfo.label}
                              {event.location && ` · 📍 ${event.location}`}
                            </div>
                            {event.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{event.description}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-pink-600">{event.participants}人</div>
                            <div className="flex gap-1 mt-1 justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); openShare('event', [event]); }}
                                className="p-1 rounded hover:bg-pink-100 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Share2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* 近期活动（参与者最关心的信息） */}
            <UpcomingPanel
              events={events}
              onEventClick={handleEventClick}
              onSubscribe={() => setActiveModal('subscribe')}
            />

            <StatsPanel events={events} year={currentYear} />

            {/* Quick share panel */}
            <div
              className="bg-white/90 rounded-2xl p-4 shadow-sm"
              style={{ border: '1px solid rgba(219,39,119,0.15)' }}
            >
              <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-1">
                <Share2 size={14} />
                快速分享
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => openShare('year', yearEvents)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 text-xs font-semibold transition-colors"
                >
                  分享全年
                  <Share2 size={12} />
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const m = now.getMonth() + 1;
                    const y = now.getFullYear();
                    const monthStr = `${y}-${String(m).padStart(2, '0')}`;
                    const monthEvs = events.filter((e) => e.date.startsWith(monthStr));
                    openShare('month', monthEvs, monthStr);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-purple-200 text-purple-600 hover:bg-purple-50 text-xs font-semibold transition-colors"
                >
                  分享本月
                  <Share2 size={12} />
                </button>
                <button
                  onClick={() => downloadJSON(events, `herstory-${currentYear}-all.json`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-white text-xs font-bold transition-all hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
                >
                  导出全部数据
                  <Upload size={12} />
                </button>
              </div>
            </div>

            {/* Quote */}
            <div
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #831843 0%, #4c1d95 100%)' }}
            >
              <div className="text-white/20 text-6xl font-black absolute -top-2 -left-1">"</div>
              <p className="text-white text-xs leading-relaxed relative z-10 italic">
                湾区通四海，有她有未来。<br />
                一齐揸fit，一齐威！<br />
                创意无界、分享互利、共创共赢，<br />
                推妳站上更大的舞台。
              </p>
              <div className="text-white/20 text-6xl font-black absolute -bottom-4 -right-1 rotate-180">"</div>
              <p className="text-pink-300 text-xs mt-3 font-semibold relative z-10">
                — 0xHerstory · 大湾区分部
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(131,24,67,0.1), rgba(76,29,149,0.1))', border: '1px solid rgba(219,39,119,0.2)' }}
          >
            <span className="font-black text-purple-900">0xHerstory · 大湾区分部</span>
            <span className="text-pink-400">·</span>
            <span className="text-pink-600">有她有未来，一起创造无限可能！</span>
            <span className="text-pink-400">❤️</span>
          </div>
        </footer>
      </main>

      {/* Floating subscribe/add button (mobile) */}
      <button
        onClick={() => (isAdmin ? openAddEvent() : setActiveModal('subscribe'))}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center z-30 hover:scale-110 transition-transform"
        style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
      >
        {isAdmin ? <Plus size={24} /> : <Bell size={24} />}
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-purple-900 text-white text-sm shadow-xl max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'add' && isAdmin && (
        <AddEventModal
          initialDate={selectedDate || undefined}
          event={null}
          onSave={handleSaveEvent}
          onClose={closeModal}
        />
      )}

      {activeModal === 'eventEdit' && selectedEvent && isAdmin && (
        <AddEventModal
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={closeModal}
        />
      )}

      {activeModal === 'day' && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          events={dayEvents}
          canEdit={isAdmin}
          onAddEvent={() => setActiveModal('add')}
          onEditEvent={(event) => {
            setSelectedEvent(event);
            setActiveModal('eventEdit');
          }}
          onShare={() => {}}
          onClose={closeModal}
        />
      )}

      {activeModal === 'share' && (
        <ShareModal
          scope={shareScope}
          events={shareEvents}
          date={shareDate}
          year={currentYear}
          event={shareScope === 'event' && shareEvents.length === 1 ? shareEvents[0] : undefined}
          onClose={closeModal}
        />
      )}

      {activeModal === 'subscribe' && (
        <SubscribeModal
          events={events}
          year={currentYear}
          organizerEmail={organizerEmail}
          subscribeEndpoint={subscribeEndpoint}
          onClose={closeModal}
        />
      )}

      {activeModal === 'github' && (
        <GithubBackupModal
          events={events}
          githubToken={githubToken}
          githubOwner={githubOwner}
          githubRepo={githubRepo}
          githubBranch={githubBranch}
          organizerEmail={organizerEmail}
          subscribeEndpoint={subscribeEndpoint}
          lastBackupAt={lastBackupAt}
          isAdmin={isAdmin}
          onSaveConfig={(cfg) => setGithubConfig(cfg)}
          onSaveSubscribeConfig={(cfg) => setSubscribeConfig(cfg)}
          onSetAdmin={(v) => setAdmin(v)}
          onRestore={(data) => {
            applyPublished(data);
            setLastBackupAt(new Date().toISOString());
            showToast(`已拉取 ${data.events.length} 场活动`);
            closeModal();
          }}
          onImportFile={(evs) => {
            importEvents(evs);
            showToast(`已导入 ${evs.length} 场活动`);
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
