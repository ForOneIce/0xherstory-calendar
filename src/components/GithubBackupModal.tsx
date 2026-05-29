import { useState, useRef } from 'react';
import { CalendarEvent, CalendarDataFile } from '../types';
import { backupToGithub, restoreFromGithub, validateGithubToken } from '../github';
import { downloadJSON } from '../share';
import {
  X, Upload, Download, Check, AlertCircle, Loader, Eye, EyeOff, ExternalLink,
  ShieldCheck, FileUp, FileDown, Mail,
} from 'lucide-react';

interface GithubBackupModalProps {
  events: CalendarEvent[];
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  organizerEmail: string;
  subscribeEndpoint: string;
  lastBackupAt: string | null;
  isAdmin: boolean;
  onSaveConfig: (cfg: { token: string; owner: string; repo: string; branch: string }) => void;
  onSaveSubscribeConfig: (cfg: { organizerEmail: string; subscribeEndpoint: string }) => void;
  onSetAdmin: (v: boolean) => void;
  onRestore: (data: CalendarDataFile) => void;
  onImportFile: (events: CalendarEvent[]) => void;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function GithubBackupModal({
  events, githubToken, githubOwner, githubRepo, githubBranch,
  organizerEmail, subscribeEndpoint, lastBackupAt, isAdmin,
  onSaveConfig, onSaveSubscribeConfig, onSetAdmin, onRestore, onImportFile, onClose,
}: GithubBackupModalProps) {
  const [token, setToken] = useState(githubToken);
  const [owner, setOwner] = useState(githubOwner);
  const [repo, setRepo] = useState(githubRepo);
  const [branch, setBranch] = useState(githubBranch || 'main');
  const [orgEmail, setOrgEmail] = useState(organizerEmail);
  const [subEndpoint, setSubEndpoint] = useState(subscribeEndpoint);
  const [showToken, setShowToken] = useState(false);
  const [backupStatus, setBackupStatus] = useState<Status>('idle');
  const [restoreStatus, setRestoreStatus] = useState<Status>('idle');
  const [validateStatus, setValidateStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [validatedUser, setValidatedUser] = useState<string | null>(isAdmin ? owner : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConfigured = token && owner && repo;

  function persistConfig() {
    onSaveConfig({ token, owner, repo, branch });
    onSaveSubscribeConfig({ organizerEmail: orgEmail, subscribeEndpoint: subEndpoint });
  }

  async function handleValidate() {
    if (!token) return;
    setValidateStatus('loading');
    setMessage('');
    try {
      const user = await validateGithubToken(token);
      setValidatedUser(user.login);
      if (!owner) setOwner(user.login);
      setValidateStatus('success');
      onSetAdmin(true);
      onSaveConfig({ token, owner: owner || user.login, repo, branch });
      setMessage(`✅ 验证成功！已进入管理员模式（${user.login}）`);
    } catch (err: any) {
      setValidateStatus('error');
      onSetAdmin(false);
      setMessage(`❌ ${err.message}`);
    }
  }

  async function handleBackup() {
    if (!isConfigured) return;
    setBackupStatus('loading');
    setMessage('');
    const config = { token, owner, repo, branch };
    try {
      persistConfig();
      await backupToGithub(config, events, {
        title: '0xHerstory · Women的活动日历',
        organizerEmail: orgEmail,
        subscribeEndpoint: subEndpoint,
      });
      setBackupStatus('success');
      setMessage(`✅ 发布成功！已同步 ${events.length} 条活动到公开仓库，访客即可访问。`);
    } catch (err: any) {
      setBackupStatus('error');
      setMessage(`❌ 发布失败：${err.message}`);
    }
  }

  async function handleRestore() {
    if (!isConfigured) return;
    setRestoreStatus('loading');
    setMessage('');
    const config = { token, owner, repo, branch };
    try {
      const data = await restoreFromGithub(config);
      onRestore(data);
      setRestoreStatus('success');
      setMessage(`✅ 已从 GitHub 拉取 ${data.events.length} 条活动数据`);
    } catch (err: any) {
      setRestoreStatus('error');
      setMessage(`❌ 拉取失败：${err.message}`);
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const evs: CalendarEvent[] = Array.isArray(parsed) ? parsed : parsed.events;
        if (!Array.isArray(evs)) throw new Error('文件格式不正确');
        onImportFile(evs);
        setMessage(`✅ 已从文件导入 ${evs.length} 条活动`);
      } catch (err: any) {
        setMessage(`❌ 导入失败：${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleExportFull() {
    downloadJSON(events, `herstory-full-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function handleSaveConfig() {
    persistConfig();
    setMessage('✅ 配置已保存到本浏览器');
  }

  const statusIcon = (s: Status) => {
    if (s === 'loading') return <Loader size={14} className="animate-spin" />;
    if (s === 'success') return <Check size={14} className="text-green-500" />;
    if (s === 'error') return <AlertCircle size={14} className="text-red-500" />;
    return null;
  };

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
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)' }}
        >
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={20} />
            <h2 className="text-lg font-bold">管理后台 · GitHub 数据</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Admin status */}
          <div className={`rounded-xl p-3 text-xs leading-relaxed ${isAdmin ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
            {isAdmin ? (
              <p className="font-semibold flex items-center gap-1"><ShieldCheck size={14} /> 当前为管理员模式，可编辑并发布活动数据。</p>
            ) : (
              <>
                <p className="font-semibold mb-1">📋 管理员说明</p>
                <p>输入 GitHub Personal Access Token（需 <code>repo</code> 权限）并验证后进入管理员模式。活动数据将发布到妳的<strong>公开仓库</strong>，参与者访问站点时自动读取。</p>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=0xHerstory-Calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-purple-600 hover:text-purple-800 font-semibold"
                >
                  <ExternalLink size={12} />
                  点此创建 Token
                </a>
              </>
            )}
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">GitHub Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={handleValidate}
              disabled={!token || validateStatus === 'loading'}
              className="mt-1 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
            >
              {statusIcon(validateStatus)}
              验证并进入管理员模式
            </button>
          </div>

          {/* Owner / Repo / Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-purple-800 mb-1">用户名</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder={validatedUser || 'github-user'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-800 mb-1">分支</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">仓库名称（公开，自动创建）</label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="herstory-calendar"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Subscribe config */}
          <div className="border-t border-pink-100 pt-4">
            <h3 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-1"><Mail size={14} /> 订阅设置（发布后对访客生效）</h3>
            <div className="space-y-2">
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                placeholder="组织者邮箱（用于邮箱订阅回退）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="url"
                value={subEndpoint}
                onChange={(e) => setSubEndpoint(e.target.value)}
                placeholder="订阅端点 URL（可选，如 Formspree）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Save config */}
          <button
            onClick={handleSaveConfig}
            className="w-full py-2 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-semibold transition-colors"
          >
            保存配置
          </button>

          {lastBackupAt && (
            <div className="text-xs text-gray-500 text-center">
              上次发布：{new Date(lastBackupAt).toLocaleString('zh-CN')}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`rounded-xl p-3 text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* GitHub Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBackup}
              disabled={!isConfigured || backupStatus === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
            >
              {statusIcon(backupStatus) || <Upload size={16} />}
              {backupStatus === 'loading' ? '发布中...' : '发布到GitHub'}
            </button>

            <button
              onClick={handleRestore}
              disabled={!isConfigured || restoreStatus === 'loading'}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold text-sm transition-all disabled:opacity-50"
            >
              {statusIcon(restoreStatus) || <Download size={16} />}
              {restoreStatus === 'loading' ? '拉取中...' : '从GitHub拉取'}
            </button>
          </div>

          {/* Local file import / export = 全量备份导入导出 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-pink-200 text-pink-600 hover:bg-pink-50 font-semibold text-sm transition-all"
            >
              <FileUp size={16} /> 导入文件
            </button>
            <button
              onClick={handleExportFull}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-pink-200 text-pink-600 hover:bg-pink-50 font-semibold text-sm transition-all"
            >
              <FileDown size={16} /> 导出全量
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {owner && repo && (
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-purple-600 hover:text-purple-800"
            >
              <ExternalLink size={12} />
              查看仓库 {owner}/{repo}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
