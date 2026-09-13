import React, { useEffect } from 'react';
import { CheckCircle2, ExternalLink, X, Tag, Users, Layers } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
      <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 overflow-hidden relative">
        {/* Üst yeşil vurgu çubuğu */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-jira-500"></div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Jira'da Subtask'lar Başarıyla Oluşturuldu</span>
              </h4>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kesin İstenen Format Toast Mesajı */}
            <p className="mt-1 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
              {toast.message}
            </p>

            {/* Platform ve Sabit Etiket Rozetleri */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                otomasyon ai
              </span>

              {toast.platforms && toast.platforms.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-jira-50 text-jira-700 border border-jira-200">
                  {p}
                </span>
              ))}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                <Users className="w-2.5 h-2.5 text-slate-500" />
                {toast.team}
              </span>
            </div>
          </div>
        </div>

        {/* Zaman çizelgesi */}
        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-[shimmer_6s_linear_infinite]" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
