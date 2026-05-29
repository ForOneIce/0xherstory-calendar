import { CalendarEvent, CalendarDataFile } from './types';

const GITHUB_API = 'https://api.github.com';
const DATA_PATH = 'calendar-data.json';

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface PublicSource {
  owner: string;
  repo: string;
  branch?: string;
}

async function githubRequest(
  config: GithubConfig,
  path: string,
  method: string = 'GET',
  body?: object
) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

// 确保仓库存在；若不存在则创建为公开仓库，以便参与者可通过 raw 直接读取数据
export async function ensureRepo(config: GithubConfig): Promise<void> {
  try {
    await githubRequest(config, `/repos/${config.owner}/${config.repo}`);
  } catch {
    await githubRequest(config, '/user/repos', 'POST', {
      name: config.repo,
      private: false,
      description: '0xHerstory 大湾区分部 · Women的活动日历数据（公开，供站点读取与订阅）',
      auto_init: true,
    });
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function getFileSha(config: GithubConfig, filePath: string): Promise<string | null> {
  try {
    const branch = config.branch || 'main';
    const data = await githubRequest(
      config,
      `/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${branch}`
    );
    return data.sha || null;
  } catch {
    return null;
  }
}

async function upsertFile(
  config: GithubConfig,
  filePath: string,
  content: string,
  message: string
) {
  const sha = await getFileSha(config, filePath);
  const encoded = btoa(unescape(encodeURIComponent(content)));
  await githubRequest(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${filePath}`,
    'PUT',
    {
      message,
      content: encoded,
      branch: config.branch || 'main',
      ...(sha ? { sha } : {}),
    }
  );
}

// 将全量数据备份/发布到 GitHub（含活动与订阅配置）
export async function backupToGithub(
  config: GithubConfig,
  events: CalendarEvent[],
  meta?: { title?: string; organizerEmail?: string; subscribeEndpoint?: string }
): Promise<void> {
  await ensureRepo(config);

  const now = new Date().toISOString();
  const data: CalendarDataFile = {
    version: '2.0',
    exportedAt: now,
    title: meta?.title,
    organizerEmail: meta?.organizerEmail,
    subscribeEndpoint: meta?.subscribeEndpoint,
    events,
  };

  await upsertFile(
    config,
    DATA_PATH,
    JSON.stringify(data, null, 2),
    `📅 发布日历数据 (${events.length}场) - ${now.slice(0, 10)}`
  );

  await upsertFile(config, 'README.md', buildReadme(events, now, config), `📋 更新README - ${now.slice(0, 10)}`);
}

function buildReadme(events: CalendarEvent[], now: string, config: GithubConfig): string {
  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];
  const byMonth: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const m = e.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(e);
  });

  let readme = `# 0xHerstory 大湾区分部 · Women的活动日历\n\n`;
  readme += `> 我们的Herstory，由每一天的共创点亮\n\n`;
  readme += `**最后更新**: ${now}\n\n`;
  readme += `**活动总数**: ${events.length}\n\n`;
  readme += `**总参与人次**: ${events.reduce((s, e) => s + e.participants, 0)}\n\n`;
  readme += `## 数据说明\n\n`;
  readme += `- \`calendar-data.json\` 为站点读取的全量活动数据，可被前端站点自动加载。\n`;
  readme += `- 站点数据源地址：\`https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch || 'main'}/${DATA_PATH}\`\n\n`;
  readme += `## 活动记录\n\n`;

  Object.keys(byMonth).sort().forEach((month) => {
    const [y, m] = month.split('-');
    readme += `### ${y}年${months[parseInt(m) - 1]}\n\n`;
    byMonth[month]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => {
        const t = e.startTime ? ` ${e.startTime}` : '';
        readme += `- **${e.date}${t}** ${e.title} — 参与 ${e.participants} 人${e.location ? ` @ ${e.location}` : ''}\n`;
      });
    readme += '\n';
  });

  return readme;
}

// 管理员通过 API 恢复（需 token，可读私有仓库）
export async function restoreFromGithub(config: GithubConfig): Promise<CalendarDataFile> {
  const branch = config.branch || 'main';
  const data = await githubRequest(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${DATA_PATH}?ref=${branch}`
  );
  const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return normalizeDataFile(JSON.parse(decoded));
}

// 访客无需 token，直接通过 raw CDN 读取公开仓库数据
export async function fetchPublicData(src: PublicSource): Promise<CalendarDataFile | null> {
  const branch = src.branch || 'main';
  const rawUrl = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${branch}/${DATA_PATH}`;
  try {
    const res = await fetch(`${rawUrl}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return normalizeDataFile(await res.json());
  } catch {
    // 回退到 API（私有仓库或 raw 未就绪时，匿名仍可能命中限流，故仅作兜底）
    try {
      const apiUrl = `${GITHUB_API}/repos/${src.owner}/${src.repo}/contents/${DATA_PATH}?ref=${branch}`;
      const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.raw+json' } });
      if (!res.ok) return null;
      return normalizeDataFile(await res.json());
    } catch {
      return null;
    }
  }
}

// 兼容 v1.0（仅 events）与 v2.0 数据格式
function normalizeDataFile(parsed: any): CalendarDataFile {
  const events: CalendarEvent[] = Array.isArray(parsed?.events) ? parsed.events : Array.isArray(parsed) ? parsed : [];
  return {
    version: parsed?.version || '1.0',
    exportedAt: parsed?.exportedAt || new Date().toISOString(),
    title: parsed?.title,
    organizerEmail: parsed?.organizerEmail,
    subscribeEndpoint: parsed?.subscribeEndpoint,
    events,
  };
}

export async function validateGithubToken(token: string): Promise<{ login: string }> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error('Token无效或权限不足');
  return res.json();
}
