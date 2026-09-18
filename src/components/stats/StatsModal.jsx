import React, { useMemo } from 'react';
import { X, BarChart3, TrendingUp, Layers, CheckCircle2, Clock } from 'lucide-react';

// Renk paleti (ekip sıralarına göre)
const TEAM_COLORS = [
  { bg: '#6366f1', light: '#eef2ff', border: '#c7d2fe' }, // indigo
  { bg: '#0ea5e9', light: '#f0f9ff', border: '#bae6fd' }, // sky
  { bg: '#10b981', light: '#ecfdf5', border: '#a7f3d0' }, // emerald
  { bg: '#f59e0b', light: '#fffbeb', border: '#fde68a' }, // amber
  { bg: '#ef4444', light: '#fef2f2', border: '#fecaca' }, // rose
  { bg: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe' }, // violet
  { bg: '#06b6d4', light: '#ecfeff', border: '#a5f3fc' }, // cyan
];

export default function StatsModal({ isOpen, onClose, subtasks = [] }) {
  if (!isOpen) return null;

  // Ekip bazlı istatistikleri hesapla
  const teamStats = useMemo(() => {
    const map = {};
    subtasks.forEach(task => {
      const team = task.team || 'Bilinmiyor';
      if (!map[team]) map[team] = { name: team, count: 0, done: 0, todo: 0 };
      map[team].count++;
      const status = (task.status || '').toLowerCase();
      if (status === 'done' || status === 'tamamlandı') map[team].done++;
      else map[team].todo++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [subtasks]);

  const maxCount = Math.max(...teamStats.map(t => t.count), 1);
  const totalSubtasks = subtasks.length;
  const totalDone = subtasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return s === 'done' || s === 'tamamlandı';
  }).length;

  // Platform istatistikleri
  const platformStats = useMemo(() => {
    const map = { FE: 0, BE: 0, App: 0 };
    subtasks.forEach(task => {
      const title = task.title || '';
      if (/\bFE\b/.test(title)) map.FE++;
      else if (/\bBE\b/.test(title)) map.BE++;
      else if (/\bApp\b/i.test(title)) map.App++;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [subtasks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-jira-600 to-indigo-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ekip İstatistikleri</h2>
              <p className="text-xs text-white/70">Son {totalSubtasks} kayıt üzerinden analiz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
          <div className="px-5 py-4 text-center border-r border-slate-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-jira-600" />
              <span className="text-2xl font-extrabold text-slate-900">{totalSubtasks}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Toplam Kayıt</p>
          </div>
          <div className="px-5 py-4 text-center border-r border-slate-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-2xl font-extrabold text-slate-900">{totalDone}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Tamamlanan</p>
          </div>
          <div className="px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-extrabold text-slate-900">{totalSubtasks - totalDone}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Devam Eden</p>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

          {/* Ekip Bazlı Bar Chart */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Ekip Başına Subtask</h3>
            </div>

            {teamStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Henüz kayıt yok.</p>
            ) : (
              <div className="space-y-3">
                {teamStats.map((team, i) => {
                  const color = TEAM_COLORS[i % TEAM_COLORS.length];
                  const pct = Math.round((team.count / maxCount) * 100);
                  return (
                    <div key={team.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color.bg }}
                          />
                          <span className="text-xs font-semibold text-slate-700">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-600 font-semibold">{team.done} done</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-bold text-slate-800">{team.count} toplam</span>
                        </div>
                      </div>
                      {/* Bar */}
                      <div className="h-7 rounded-lg overflow-hidden" style={{ backgroundColor: color.light, border: `1px solid ${color.border}` }}>
                        <div
                          className="h-full rounded-lg transition-all duration-700 flex items-center px-2.5"
                          style={{
                            width: `${Math.max(pct, 8)}%`,
                            backgroundColor: color.bg,
                          }}
                        >
                          <span className="text-white text-[10px] font-bold whitespace-nowrap">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform Dağılımı */}
          {platformStats.some(p => p.count > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Platform Dağılımı</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {platformStats.map((plat, i) => {
                  const colors = [
                    { bg: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
                    { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
                    { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                  ];
                  const c = colors[i % colors.length];
                  return (
                    <div key={plat.name} className={`${c.light} ${c.border} border rounded-xl p-3 text-center`}>
                      <span className={`text-2xl font-extrabold ${c.text}`}>{plat.count}</span>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{plat.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Veriler yerel kayıtlara dayanmaktadır
          </p>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
