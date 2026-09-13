import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, Check, Cpu } from 'lucide-react';

export default function GeminiLoading({ storyKey }) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, text: `${storyKey || 'Story'} gereksinimleri ve kabul kriterleri taranıyor...` },
    { id: 2, text: 'Pozitif, negatif ve sınır (boundary) test senaryoları türetiliyor...' },
    { id: 3, text: 'Gherkin / Markdown test paketi yapılandırılıyor...' },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(2), 1000);
    const timer2 = setTimeout(() => setCurrentStep(3), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-50/70 via-indigo-50/40 to-white border border-purple-200/80 shadow-inner space-y-6 animate-fade-in">
      
      {/* Üst Parıltılı Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900">Gemini 1.5/2.0 Flash İşliyor</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              QA Model
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Jira Story analiz ediliyor ve kurumsal test senaryoları hazırlanıyor...
          </p>
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
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isCurrent 
                  ? 'bg-white shadow-sm border border-purple-200 text-purple-900 font-semibold' 
                  : isDone 
                  ? 'text-slate-600 bg-white/50' 
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                isDone 
                  ? 'bg-emerald-500 text-white' 
                  : isCurrent 
                  ? 'bg-purple-600 text-white animate-bounce' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <span className="text-xs sm:text-sm">{step.text}</span>
            </div>
          );
        })}
      </div>

      {/* Skeleton / Shimmer Efekti */}
      <div className="space-y-2.5 pt-2 border-t border-purple-100/60">
        <div className="h-4 bg-purple-100/80 rounded-md w-3/4 animate-pulse"></div>
        <div className="h-3.5 bg-slate-200/80 rounded-md w-full animate-pulse"></div>
        <div className="h-3.5 bg-slate-200/70 rounded-md w-5/6 animate-pulse"></div>
        <div className="h-3.5 bg-purple-100/60 rounded-md w-2/3 animate-pulse"></div>
      </div>

    </div>
  );
}
