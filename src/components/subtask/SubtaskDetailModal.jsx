import React from 'react';
import { X, GitPullRequest, Tag, Users, CheckCircle2, Calendar, User, ExternalLink } from 'lucide-react';

export default function SubtaskDetailModal({ subtask, onClose }) {
  if (!subtask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Üst Başlık */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-jira-50 border border-jira-200 flex items-center justify-center text-jira-600">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-jira-700 bg-jira-100/70 px-2 py-0.5 rounded border border-jira-200">
                {subtask.id}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Jira Subtask Detayları</h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Subtask Başlığı
            </label>
            <p className="text-base font-bold text-slate-900 mt-1">
              {subtask.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Ana Story</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{subtask.parentKey}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Durum</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-xs mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {subtask.status}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">MPTeam Alanı</span>
              <span className="font-semibold text-jira-700">{subtask.team}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Sabit Jira Etiketi</span>
              <span className="font-mono font-bold text-emerald-700">{subtask.label}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Oluşturan</span>
              <span className="text-slate-700 font-medium">{subtask.author}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Oluşturulma Zamanı</span>
              <span className="text-slate-700 font-medium">{subtask.createdAt}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
