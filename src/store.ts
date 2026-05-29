import { create } from 'zustand';
import { CalendarEvent, AppState } from './types';
import { SAMPLE_EVENTS } from './sampleData';

const STORAGE_KEY = 'herstory_2026_data';

type PersistShape = Omit<AppState, 'events'> & { events: CalendarEvent[] };

function loadFromStorage(): Partial<PersistShape> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(state: Partial<PersistShape>) {
  try {
    // 不持久化 isAdmin 之外的敏感性由调用方控制；token 仅存本地浏览器
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface StoreActions {
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setCurrentYear: (year: number) => void;
  setGithubConfig: (cfg: { token: string; owner: string; repo: string; branch?: string }) => void;
  setSubscribeConfig: (cfg: { organizerEmail: string; subscribeEndpoint: string }) => void;
  setLastBackupAt: (time: string) => void;
  setLastSyncedAt: (time: string) => void;
  setAdmin: (v: boolean) => void;
  importEvents: (events: CalendarEvent[]) => void;
  loadPublishedData: (data: {
    events: CalendarEvent[];
    organizerEmail?: string;
    subscribeEndpoint?: string;
  }) => void;
}

const persisted = loadFromStorage();

function persist(get: () => AppState) {
  const s = get();
  saveToStorage({
    events: s.events,
    currentYear: s.currentYear,
    githubToken: s.githubToken,
    githubOwner: s.githubOwner,
    githubRepo: s.githubRepo,
    githubBranch: s.githubBranch,
    lastBackupAt: s.lastBackupAt,
    lastSyncedAt: s.lastSyncedAt,
    isAdmin: s.isAdmin,
    organizerEmail: s.organizerEmail,
    subscribeEndpoint: s.subscribeEndpoint,
  });
}

export const useStore = create<AppState & StoreActions>((set, get) => ({
  events: persisted.events ?? SAMPLE_EVENTS,
  currentYear: persisted.currentYear ?? new Date().getFullYear(),
  githubToken: persisted.githubToken ?? '',
  githubRepo: persisted.githubRepo ?? 'herstory-calendar',
  githubOwner: persisted.githubOwner ?? '',
  githubBranch: persisted.githubBranch ?? 'main',
  lastBackupAt: persisted.lastBackupAt ?? null,
  lastSyncedAt: persisted.lastSyncedAt ?? null,
  isAdmin: persisted.isAdmin ?? false,
  organizerEmail: persisted.organizerEmail ?? '',
  subscribeEndpoint: persisted.subscribeEndpoint ?? '',

  addEvent: (event) => {
    set((state) => ({ events: [...state.events, event] }));
    persist(get);
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    }));
    persist(get);
  },

  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    persist(get);
  },

  setCurrentYear: (year) => {
    set({ currentYear: year });
    persist(get);
  },

  setGithubConfig: ({ token, owner, repo, branch }) => {
    set({ githubToken: token, githubOwner: owner, githubRepo: repo, githubBranch: branch || 'main' });
    persist(get);
  },

  setSubscribeConfig: ({ organizerEmail, subscribeEndpoint }) => {
    set({ organizerEmail, subscribeEndpoint });
    persist(get);
  },

  setLastBackupAt: (time) => {
    set({ lastBackupAt: time });
    persist(get);
  },

  setLastSyncedAt: (time) => {
    set({ lastSyncedAt: time });
    persist(get);
  },

  setAdmin: (v) => {
    set({ isAdmin: v });
    persist(get);
  },

  importEvents: (events) => {
    set({ events });
    persist(get);
  },

  loadPublishedData: ({ events, organizerEmail, subscribeEndpoint }) => {
    set((state) => ({
      events,
      organizerEmail: organizerEmail ?? state.organizerEmail,
      subscribeEndpoint: subscribeEndpoint ?? state.subscribeEndpoint,
    }));
    persist(get);
  },
}));
