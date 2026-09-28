import React from 'react';
import { Users, Tag, CheckCircle2 } from 'lucide-react';
import ActionGrid from './ActionGrid';
import RecentActivity from './RecentActivity';

export default function Dashboard({
  user = 'Hüseyin Ç.',
  selectedTeam,
  onOpenCreateSubtask,
  onOpenCreateIpk,
  onOpenCreateDevSubtask,
  onOpenCreateStory,
  onOpenCreateBug,
  onOpenPlanningPoker,
  subtasks,
  onSelectSubtask
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">

      {/* 1. Sade ve Ferah Karşılama Alanı */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Merhaba, {user} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xl">
            Jira Story'nizi girin, Gemini AI ile test senaryolarını, Story'leri, Planning Poker efor tahminlerini, Issue/Bug'ları ve IPK Demand taleplerini saniyeler içinde Jira'ya aktarın.
          </p>
        </div>

        {/* Minimalist Takım Rozeti */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto">
          <Users className="w-3.5 h-3.5 text-jira-600" />
          <span className="text-slate-400">Takım:</span>
          <span className="font-bold text-slate-800">{selectedTeam}</span>
        </div>
      </div>

      {/* 2. Kompakt Aksiyon Seçici (Subtask, Story, Dev Subtask, Poker, İPK, Bug) */}
      <ActionGrid
        onOpenCreateSubtask={onOpenCreateSubtask}
        onOpenCreateIpk={onOpenCreateIpk}
        onOpenCreateDevSubtask={onOpenCreateDevSubtask}
        onOpenCreateStory={onOpenCreateStory}
        onOpenCreateBug={onOpenCreateBug}
        onOpenPlanningPoker={onOpenPlanningPoker}
      />

      {/* 3. Sade Son İşlemler Tablosu */}
      <RecentActivity
        subtasks={subtasks}
        onSelectSubtask={onSelectSubtask}
      />

    </div>
  );
}
