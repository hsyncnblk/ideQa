import React, { useState } from 'react';
import { Users, ArrowRight, Sparkles, Building2, ChevronDown } from 'lucide-react';
import { MP_TEAMS, FIXED_AUTOMATION_LABEL } from '../../constants/jiraConstants';

export default function TeamSetupModal({ onTeamConfirmed }) {
  const [selectedTeam, setSelectedTeam] = useState(MP_TEAMS[0].name);

  const handleConfirm = () => {
    onTeamConfirmed(selectedTeam);
  };

  const currentTeamObj = MP_TEAMS.find((t) => t.name === selectedTeam) || MP_TEAMS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up">

        {/* Modal Üst Başlık */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jira-50 text-jira-600 flex items-center justify-center border border-jira-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-jira-700 bg-jira-50 px-2 py-0.5 rounded uppercase tracking-wider">
                Adım 2 / 2
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Çalışma Ekibinizi Belirleyin
              </h3>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Oluşturulacak tüm test subtask'ları seçtiğiniz MPTeam alanına otomatik bağlanacaktır.
          </p>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Aktif MPTeam
            </label>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-jira-100 focus:border-jira-500 transition-all cursor-pointer"
              >
                {MP_TEAMS.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name} — {team.domain}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Seçili Takım Bilgisi */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>{currentTeamObj.name}</span>
              <span className="text-[11px] text-slate-500 font-normal">Execiton Lead : {currentTeamObj.lead}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentTeamObj.domain}
            </p>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>
              Jira Etiketi: <strong className="font-mono">{FIXED_AUTOMATION_LABEL}</strong> kalıcı eklenir.
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 px-4 rounded-xl jira-gradient-bg text-white font-bold text-sm shadow-md shadow-jira-600/25 hover:shadow-jira-600/35 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Devam Et & Dashboard'a Geç</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
