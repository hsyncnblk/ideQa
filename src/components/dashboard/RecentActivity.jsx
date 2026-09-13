import React from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Tag, 
  Users, 
  Layers, 
  GitPullRequest 
} from 'lucide-react';

export default function RecentActivity({ subtasks, onSelectSubtask }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      
      {/* Bölüm Başlığı */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Son Oluşturulan Subtask'lar
          </h3>
          <p className="text-xs text-slate-400">
            Jira senkronizasyonu tamamlanan test kayıtları
          </p>
        </div>

        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
          {subtasks.length} kayıt
        </span>
      </div>

      {/* Liste Tablosu */}
      <div className="divide-y divide-slate-100">
        {subtasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Layers className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">Henüz oluşturulmuş bir test subtask'ı yok.</p>
          </div>
        ) : (
          subtasks.map((task) => (
            <div 
              key={task.id}
              className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-jira-50 border border-jira-200/70 flex items-center justify-center text-jira-600 flex-shrink-0 mt-0.5">
                  <GitPullRequest className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-jira-700">
                      {task.id}
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      ↳ <span className="font-medium text-slate-600">{task.parentKey}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5 truncate">
                    {task.title}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {task.team}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      {task.label}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">
                      {task.createdAt}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectSubtask(task)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-jira-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <span>Detay</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
