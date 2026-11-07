import React, { useState, useEffect } from 'react';
import { Code2, Check, Terminal, Layers, ArrowRight } from 'lucide-react';

export default function DevSubtaskLoading({ storyKeys = [], selectedPlatforms = [], variant = 'dev' }) {
  const [currentStep, setCurrentStep] = useState(1);
  const isTest = variant === 'test';
  const storyLabel = storyKeys.length > 0 ? storyKeys.join(', ') : 'Story';
  const prefix = isTest ? 'Test ' : 'Dev ';

  const steps = [
    {
      id: 1,
      title: storyKeys.length > 1 ? `${storyKeys.length} Jira Story Bilgisi Çekiliyor` : 'Jira Story Bilgisi Çekiliyor',
      desc: `${storyLabel} Jira REST API üzerinden doğrulanıyor ve başlık/kapsam alınıyor...`,
    },
    {
      id: 2,
      title: isTest ? 'Platform Test Görevleri Yapılandırılıyor' : 'Platform Dev Görevleri Yapılandırılıyor',
      desc: `Seçili platformlar (${selectedPlatforms.join(', ') || 'FE, BE, App'}) için ${isTest ? 'boş test' : 'geliştirici'} subtask şablonları hazırlanıyor...`,
    },
    {
      id: 3,
      title: 'Jira Issue Bağlantıları Atanıyor',
      desc: 'Sprint, bileşenler ve ana story bağlantıları Jira üzerinde ilişkilendiriliyor...',
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(2), 600);
    const timer2 = setTimeout(() => setCurrentStep(3), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-50/80 via-slate-50 to-white border border-indigo-200 shadow-sm space-y-6 animate-fade-in">
      
      {/* Üst Dev Başlığı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Code2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">{isTest ? "Test Subtask'ları Oluşturuluyor" : "Dev Subtask'ları Oluşturuluyor"}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono">
                {isTest ? 'Boş Senaryo' : 'Dev Mode'} • Jira API
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isTest
                ? 'Yapay zeka kullanılmadan platforma özel (App, BE, FE) boş test görevleri açılıyor'
                : 'Geliştiriciler için doğrudan platforma özel (App, BE, FE) boş Jira görevleri açılıyor'}
            </p>
          </div>
        </div>

        {/* Seçili Platform Rozetleri */}
        <div className="hidden sm:flex items-center gap-1.5">
          {selectedPlatforms.map((plat) => (
            <span
              key={plat}
              className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs"
            >
              {plat}
            </span>
          ))}
        </div>
      </div>

      {/* Aşamalı İlerleme Listesi */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl transition-all border ${
                isCurrent
                  ? 'bg-white shadow-sm border-indigo-300 text-indigo-950 ring-1 ring-indigo-200'
                  : isDone
                  ? 'bg-white/80 border-emerald-200 text-slate-700'
                  : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{step.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-indigo-600 animate-pulse font-semibold">
                        İşleniyor...
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                        Tamamlandı ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dev Konsol / Terminal Simülasyonu */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 font-mono text-[11px] text-slate-300 space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-500 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-indigo-400" />
            <span>JIRA_REST_CLIENT // DEV_PIPELINE</span>
          </div>
          <span className="text-emerald-400">● CANLI</span>
        </div>
        <div className="space-y-1 pt-1">
          {(storyKeys.length > 0 ? storyKeys : ['STORY']).map((key) => (
            <div key={`get-${key}`} className="text-slate-400 flex items-center gap-2">
              <span className="text-indigo-400">&gt;</span>
              <span>GET /rest/api/2/issue/{key}</span>
              <span className="text-emerald-400 text-[10px]">[OK]</span>
            </div>
          ))}
          {(storyKeys.length > 0 ? storyKeys : ['STORY']).flatMap((key) =>
            selectedPlatforms.map((plat) => (
            <div
              key={`${key}-${plat}`}
              className={`flex items-center gap-2 transition-opacity ${
                currentStep >= 2 ? 'text-indigo-300' : 'text-slate-600'
              }`}
            >
              <span className="text-indigo-400">&gt;</span>
              <span>
                POST /rest/api/2/issue [{prefix}{plat} - {key}]
              </span>
              {currentStep >= 3 ? (
                <span className="text-emerald-400 text-[10px]">CREATED</span>
              ) : currentStep === 2 ? (
                <span className="text-amber-400 text-[10px] animate-pulse">POSTING...</span>
              ) : (
                <span className="text-slate-600 text-[10px]">QUEUED</span>
              )}
            </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
