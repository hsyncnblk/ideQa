import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  RotateCcw, 
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { geminiService } from '../../services/geminiService';
import SubtaskConfigStep from './SubtaskConfigStep';
import PlatformTabsPreview from './PlatformTabsPreview';
import GeminiLoading from './GeminiLoading';

export default function SubtaskDrawer({ 
  isOpen, 
  onClose, 
  selectedTeam, 
  onSubtaskCreated,
  isCreatingSubtask 
}) {
  // Aşama 1: Konfigürasyon Durumları
  const [storyKey, setStoryKey] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['FE', 'BE']);
  const [extraGuidance, setExtraGuidance] = useState('');
  const [inputError, setInputError] = useState('');

  // Aşama 2: Üretim ve Düzenleme Durumları
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  if (!isOpen) return null;

  // Platform seçim toggle
  const handleTogglePlatform = (platformId) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        if (prev.length === 1) return prev; // En az 1 platform seçili kalmalı
        return prev.filter((p) => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Gemini Senaryo Üretimi
  const handleGenerate = async () => {
    const cleanKey = storyKey.trim().toUpperCase();

    if (!cleanKey) {
      setInputError('Lütfen geçerli bir Jira Story No girin (Örn: PROJ-123)');
      return;
    }

    if (!cleanKey.includes('-')) {
      setInputError('Story numarası proje kodu içermelidir (Örn: PROJ-123 veya PAY-450)');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setInputError('Lütfen en az bir platform (App, BE, FE) seçin.');
      return;
    }

    setInputError('');
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const result = await geminiService.generatePlatformScenarios({
        storyKey: cleanKey,
        platforms: selectedPlatforms,
        extraGuidance,
        teamName: selectedTeam,
      });

      setGeneratedResult(result);
    } catch (err) {
      setInputError(err.message || 'Senaryo üretilirken bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Düzenlenebilir Senaryo Metin Güncellemesi
  const handleScenarioChange = (platform, type, newContent) => {
    setGeneratedResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenarios: {
          ...prev.scenarios,
          [platform]: {
            ...prev.scenarios[platform],
            [type]: {
              ...prev.scenarios[platform][type],
              content: newContent,
            },
          },
        },
      };
    });
  };

  // Senaryo Onay Kutusu (Checkbox) Toggle
  const handleScenarioSelectToggle = (platform, type) => {
    setGeneratedResult((prev) => {
      if (!prev) return prev;
      const currentSelected = prev.scenarios[platform][type].selected;
      return {
        ...prev,
        scenarios: {
          ...prev.scenarios,
          [platform]: {
            ...prev.scenarios[platform],
            [type]: {
              ...prev.scenarios[platform][type],
              selected: !currentSelected,
            },
          },
        },
      };
    });
  };

  // Jira'ya Aktarım: Seçili her platform için ayrı subtask (Test [Platform] - [Story No])
  const handleExportToJira = async () => {
    if (!generatedResult) return;

    // En az 1 senaryosu seçili olan platformları filtrele
    const platformsToExport = Object.keys(generatedResult.scenarios).filter((plat) => {
      const platData = generatedResult.scenarios[plat];
      return platData.positive.selected || platData.negative.selected;
    });

    if (platformsToExport.length === 0) {
      alert('Lütfen Jira\'ya aktarmak için en az bir senaryo seçin.');
      return;
    }

    // Mikro kutlama konfetisi
    confetti({
      particleCount: 70,
      spread: 75,
      origin: { y: 0.85 },
    });

    // Ana uygulamaya aktar
    await onSubtaskCreated({
      storyKey: generatedResult.storyKey,
      storySummary: generatedResult.storySummary,
      platforms: platformsToExport,
      scenarios: generatedResult.scenarios,
      team: selectedTeam,
    });

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStoryKey('');
    setSelectedPlatforms(['FE', 'BE']);
    setExtraGuidance('');
    setInputError('');
    setIsGenerating(false);
    setGeneratedResult(null);
  };

  // Kaç platform ve subtask aktarılacağını hesapla
  const activeExportCount = generatedResult 
    ? Object.keys(generatedResult.scenarios).filter((plat) => {
        const p = generatedResult.scenarios[plat];
        return p.positive.selected || p.negative.selected;
      }).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      
      {/* Karartma Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slide-in-right">
          
          {/* Drawer Başlık */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg jira-gradient-bg flex items-center justify-center text-white shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Story'e Subtask Test Oluştur
                </h3>
                <p className="text-xs text-slate-500">
                  Platforma özgü (App, BE, FE) test senaryoları ve otomatik Jira Subtask'ları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {generatedResult && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Yeni Senaryo Girişi Yap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yeniden Başla</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer İçerik Akışı (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. ADIM: KONFİGÜRASYON VE GİRDİLER */}
            {!generatedResult && !isGenerating && (
              <SubtaskConfigStep
                storyKey={storyKey}
                onStoryKeyChange={setStoryKey}
                selectedPlatforms={selectedPlatforms}
                onTogglePlatform={handleTogglePlatform}
                extraGuidance={extraGuidance}
                onExtraGuidanceChange={setExtraGuidance}
                inputError={inputError}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            )}

            {/* 2. ADIM: YÜKLENİYOR SİMÜLASYONU */}
            {isGenerating && (
              <GeminiLoading storyKey={storyKey.toUpperCase()} />
            )}

            {/* 3. ADIM: DÜZENLENEBİLİR PLATFORM SEKMELERİ VE SENARYOLAR */}
            {generatedResult && !isGenerating && (
              <PlatformTabsPreview
                storyKey={generatedResult.storyKey}
                selectedTeam={selectedTeam}
                scenariosByPlatform={generatedResult.scenarios}
                onScenarioChange={handleScenarioChange}
                onScenarioSelectToggle={handleScenarioSelectToggle}
              />
            )}

          </div>

          {/* Drawer Alt Şerit: JİRA'YA AKTARIM */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <button
              type="button"
              onClick={handleExportToJira}
              disabled={!generatedResult || activeExportCount === 0 || isCreatingSubtask}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                generatedResult && activeExportCount > 0 && !isCreatingSubtask
                  ? 'jira-gradient-bg text-white shadow-md shadow-jira-600/25 hover:shadow-jira-600/35 hover:brightness-105 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              {isCreatingSubtask ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{activeExportCount} Adet Jira Subtask Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {generatedResult && activeExportCount > 0
                      ? `Seçili Senaryoları Jira'ya Gönder (${activeExportCount} Subtask)`
                      : "Seçili Senaryoları Jira'ya Gönder"}
                  </span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              {generatedResult
                ? `Her platform için "Test [Platform] - ${generatedResult.storyKey}" adıyla ayrı subtask oluşturulacaktır.`
                : 'Önce Story No ve Platformları seçip Gemini ile senaryo üretmelisiniz.'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
