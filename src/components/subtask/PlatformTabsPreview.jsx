import React, { useState } from 'react';
import {
  Smartphone,
  Server,
  Globe,
  Tag,
  Users,
  Info,
  CheckCheck
} from 'lucide-react';
import EditableScenarioCard from './EditableScenarioCard';
import { getTeamJiraMapping } from '../../constants/jiraConstants';

const PLATFORM_ICONS = {
  App: Smartphone,
  BE: Server,
  FE: Globe,
};

export default function PlatformTabsPreview({
  storyKey,
  selectedTeam,
  scenariosByPlatform,
  onScenarioChange,
  onScenarioSelectToggle,
}) {
  const platformKeys = Object.keys(scenariosByPlatform);
  const [activeTab, setActiveTab] = useState(platformKeys[0] || 'FE');

  const currentPlatformData = scenariosByPlatform[activeTab] || scenariosByPlatform[platformKeys[0]];
  const teamMapping = getTeamJiraMapping(selectedTeam);

  if (!currentPlatformData) return null;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Sabit Bilgi Notu & Dinamik Jira Başlık Formatı Bildirimi */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/70 text-xs text-slate-700">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-jira-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Jira Otomasyon Eşleşmesi:
            </p>
            <p className="text-slate-600">
              Seçilen her platform için <strong className="font-mono text-jira-700">Test [Platform] - {storyKey}</strong> adıyla ayrı bir Jira Subtask oluşturulacaktır.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                <Tag className="w-2.5 h-2.5" /> otomasyon_ai
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-jira-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                <Users className="w-2.5 h-2.5" /> MP TEAM: {teamMapping.mpTeam || selectedTeam}
              </span>
              {teamMapping.component && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300">
                  Bileşen: {teamMapping.component}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Sekmeleri (Tabs: App, BE, FE) */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {platformKeys.map((plat) => {
          const Icon = PLATFORM_ICONS[plat] || Globe;
          const isActive = activeTab === plat;
          const platData = scenariosByPlatform[plat];

          const selectedCount = (platData.positive.selected ? 1 : 0) + (platData.negative.selected ? 1 : 0);

          return (
            <button
              key={plat}
              type="button"
              onClick={() => setActiveTab(plat)}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                  ? 'border-jira-600 text-jira-700 bg-jira-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{plat} ({platData.platformName})</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCount > 0
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-200 text-slate-500'
                }`}>
                {selectedCount}/2
              </span>
            </button>
          );
        })}
      </div>

      {/* Aktif Sekme Açıklaması */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-bold text-slate-800">
            {currentPlatformData.platformName} Test Paketi
          </span>
          <span className="text-xs text-slate-400 ml-2">
            ({currentPlatformData.framework})
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Metinleri düzenleyebilir, aktarmak istediklerinizi seçebilirsiniz
        </span>
      </div>

      {/* Pozitif ve Negatif Senaryolar (Gruplar) */}
      <div className="space-y-3.5">

        {/* 1. Pozitif Senaryolar */}
        <EditableScenarioCard
          type="positive"
          title={currentPlatformData.positive.title}
          content={currentPlatformData.positive.content}
          isSelected={currentPlatformData.positive.selected}
          onToggleSelect={() => onScenarioSelectToggle(activeTab, 'positive')}
          onContentChange={(newContent) => onScenarioChange(activeTab, 'positive', newContent)}
        />

        {/* 2. Negatif Senaryolar */}
        <EditableScenarioCard
          type="negative"
          title={currentPlatformData.negative.title}
          content={currentPlatformData.negative.content}
          isSelected={currentPlatformData.negative.selected}
          onToggleSelect={() => onScenarioSelectToggle(activeTab, 'negative')}
          onContentChange={(newContent) => onScenarioChange(activeTab, 'negative', newContent)}
        />

      </div>

    </div>
  );
}
