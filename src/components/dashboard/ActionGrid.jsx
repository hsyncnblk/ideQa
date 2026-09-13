import React from 'react';
import {
  Sparkles,
  PlusCircle,
  FileText,
  Bug,
  FileCheck2,
  ArrowRight,
  Lock
} from 'lucide-react';

export default function ActionGrid({ onOpenCreateSubtask }) {
  const actions = [
    {
      id: 'subtask',
      title: "Story'e Subtask Test Oluştur",
      subtitle: 'Gemini AI ile test senaryoları',
      icon: Sparkles,
      isActive: true,
      onClick: onOpenCreateSubtask,
      badge: 'AI Destekli',
    },
    {
      id: 'story',
      title: 'Story Oluştur',
      subtitle: 'Kabul kriteri ve hikaye üretimi',
      icon: FileText,
      isActive: false,
      badge: 'Yakında',
    },
    {
      id: 'ipk',
      title: 'İPK Oluştur',
      subtitle: 'İhtiyaç & proje kabul süreçleri',
      icon: FileCheck2,
      isActive: false,
      badge: 'Yakında',
    },
    {
      id: 'bug',
      title: 'Bug Oluştur',
      subtitle: 'Log ve ekran görüntüsünden hata',
      icon: Bug,
      isActive: false,
      badge: 'Yakında',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          İşlem Seçin
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          Etiket: <strong className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">otomasyon_ai</strong>
        </span>
      </div>

      {/* Kompakt ve Sade 4'lü Aksiyon Izgarası (Sıralama: Subtask, Story, İPK, Bug) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {actions.map((action) => {
          const Icon = action.icon;

          if (action.isActive) {
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-white hover:bg-slate-50/80 border-2 border-jira-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg jira-gradient-bg text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-4 h-4 text-amber-300" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-jira-50 text-jira-700 border border-jira-200">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-jira-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {action.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-jira-600">
                  <span>Başlat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          }

          return (
            <div
              key={action.id}
              className="relative flex flex-col justify-between p-4 rounded-xl bg-white/60 border border-slate-200/80 text-left opacity-70 hover:opacity-85 transition-opacity"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    {action.badge}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-700">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {action.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Devre dışı</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
