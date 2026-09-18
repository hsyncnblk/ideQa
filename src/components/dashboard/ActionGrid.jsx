/**
 * @module components/dashboard/ActionGrid
 *
 * Schema-driven action card grid.
 * Card definitions come from actionCardSchemas — no hardcoded if/else chains.
 * Adding a new card = adding one object to the schema file.
 */

import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { ACTION_CARDS } from '../../schemas/actionCardSchemas';

export default function ActionGrid(props) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ACTION_CARDS.map((card) => {
          const Icon = card.icon;
          const onClick = props[card.onClickKey];
          const { theme } = card;

          if (card.isActive) {
            return (
              <button
                key={card.id}
                onClick={onClick}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-white hover:bg-slate-50/80 border-2 border-jira-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-xs ${theme.iconBg}`}>
                      <Icon className={`w-4 h-4 ${theme.iconColor}`} />
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badge}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-jira-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>

                <div className={`mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold ${theme.accent}`}>
                  <span>Başlat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          }

          return (
            <div
              key={card.id}
              className="relative flex flex-col justify-between p-4 rounded-xl bg-white/60 border border-slate-200/80 text-left opacity-70 hover:opacity-85 transition-opacity"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-700">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {card.subtitle}
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
