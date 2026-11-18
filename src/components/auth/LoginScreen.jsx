import React, { useState } from 'react';
import {
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Globe
} from 'lucide-react';
import { envConfig } from '../../config/envConfig';
import { jiraService } from '../../services/jiraService';

export default function LoginScreen({ onLoginSuccess }) {
  const [jiraUrl, setJiraUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem('jira_custom_base_url') || '';
    if (saved && (saved.includes('turkuvaz-jira') || saved.includes('your-domain'))) {
      localStorage.removeItem('jira_custom_base_url');
      return '';
    }
    if (saved) {
      return saved;
    }
    const envUrl = envConfig.jira.baseUrl || '';
    if (envUrl && !envUrl.includes('your-domain') && !envUrl.includes('turkuvaz-jira')) {
      return envUrl;
    }
    return '';
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('jira_email') || '';
  });
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJiraUrlChange = (e) => {
    const val = e.target.value;
    setJiraUrl(val);
    if (error) setError('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('jira_custom_base_url', val.trim());
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (error) setError('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('jira_email', val.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jiraUrl.trim()) {
      setError('Lütfen Jira adresinizi girin (Örn: firmaniz.atlassian.net).');
      return;
    }
    if (!email.trim()) {
      setError('Lütfen Jira e-posta adresinizi girin.');
      return;
    }
    if (!token.trim()) {
      setError('Lütfen API Token girin.');
      return;
    }

    // URL'i normalize et (örn: sirket.atlassian.net -> https://sirket.atlassian.net)
    let cleanUrl = jiraUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const parsed = new URL(cleanUrl);
      cleanUrl = parsed.origin;
    } catch {
      setError('Lütfen geçerli bir Jira adresi girin (Örn: firmaniz.atlassian.net).');
      return;
    }

    // Kullanıcı adresini ve e-postasını kalıcı hatırla
    if (typeof window !== 'undefined') {
      localStorage.setItem('jira_custom_base_url', cleanUrl);
      localStorage.setItem('jira_email', email.trim());
    }
    setJiraUrl(cleanUrl);

    setError('');
    setIsLoading(true);

    try {
      const userInfo = await jiraService.validateToken(email.trim(), token.trim(), cleanUrl);
      onLoginSuccess(token.trim(), userInfo, cleanUrl);
    } catch (err) {
      setError(err.message || 'Giriş doğrulanamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">

      {/* İnce arka plan parıltısı */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-jira-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Başlık Alanı */}
      <div className="text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl jira-gradient-bg text-white shadow-lg mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Jira <span className="text-jira-400">AI</span> Test Asistanı
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Gemini AI destekli test senaryosu ve Subtask üretim ortamı
        </p>
      </div>

      {/* Giriş Kartı */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-7 z-10">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Giriş Yap</h2>
            <p className="text-xs text-slate-500">Atlassian hesap bilgilerinizi girin</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-jira-50 text-jira-700 border border-jira-200">
            <Lock className="w-2.5 h-2.5 text-jira-600" />
            API Token
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Jira URL / Site Alanı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jira Adresi (Domain)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={jiraUrl}
                onChange={handleJiraUrlChange}
                placeholder="firmaniz.atlassian.net"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-jira-500 focus:ring-jira-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Örn: firmaniz.atlassian.net veya https://firmaniz.atlassian.net
            </p>
          </div>

          {/* Email Alanı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              E-posta
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="ornek@sirket.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-jira-500 focus:ring-jira-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Token Alanı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              API Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError('');
                }}
                placeholder="ATATT3xFfGF0ciZL..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-jira-500 focus:ring-jira-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end pt-0.5">
            <span className="text-[10px] text-slate-400">Oturumda güvenle tutulur</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl jira-gradient-bg text-white font-bold text-sm shadow-md shadow-jira-600/25 hover:shadow-jira-600/35 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            Bilgileriniz yalnızca tarayıcınızın yerel oturumunda tutulur.
          </p>
        </div>
      </div>

    </div>
  );
}
