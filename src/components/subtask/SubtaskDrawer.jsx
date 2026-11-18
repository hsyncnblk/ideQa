import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  RotateCcw,
  Code2,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';
import SubtaskConfigStep from './SubtaskConfigStep';
import PlatformTabsPreview from './PlatformTabsPreview';
import GeminiLoading from './GeminiLoading';
import AiTokenModal from '../shared/AiTokenModal';
import { getAiConfig } from '../../core/aiConfig';

import DevSubtaskLoading from './DevSubtaskLoading';

export default function SubtaskDrawer({ 
  isOpen, 
  onClose, 
  selectedTeam, 
  onSubtaskCreated,
  isCreatingSubtask,
  mode = 'test' // 'test' | 'dev'
}) {
  const isDevMode = mode === 'dev';

  // Aşama 1: Konfigürasyon Durumları
  const [storyKey, setStoryKey] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(isDevMode ? ['BE'] : ['FE', 'BE']);
  const [extraGuidance, setExtraGuidance] = useState('');
  const [customImage, setCustomImage] = useState(null);
  const [useAi, setUseAi] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [inputError, setInputError] = useState('');

  // Aşama 2: Üretim ve Düzenleme Durumları
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  if (!isOpen) return null;

  const handleCustomImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setInputError('Görsel boyutu maksimum 5 MB olabilir.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      setCustomImage({
        name: file.name,
        mimeType: file.type || 'image/png',
        base64: base64Data,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomImage = () => {
    if (customImage?.previewUrl) {
      URL.revokeObjectURL(customImage.previewUrl);
    }
    setCustomImage(null);
  };

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

  // Ana aksiyon: Test modda Gemini (veya boş subtask), Dev modda direkt Jira'ya gönder
  const handleGenerate = async () => {
    // Virgül / noktalı virgül / boşluk ile ayrılmış key'leri ayrıştır (tekrarları temizle)
    const keys = [...new Set(
      storyKey
        .split(/[,;\s]+/)
        .map((k) => k.trim().toUpperCase())
        .filter(Boolean)
    )];

    if (keys.length === 0) {
      setInputError('Lütfen geçerli bir Jira Story No girin (Örn: PROJ-123)');
      return;
    }

    if (!isDevMode && keys.length > 1) {
      setInputError('Test subtask için tek bir Story numarası girin.');
      return;
    }

    const invalidKeys = keys.filter((k) => !/^[A-Z][A-Z0-9_]*-\d+$/.test(k));
    if (invalidKeys.length > 0) {
      setInputError(`Geçersiz Story numarası: ${invalidKeys.join(', ')} (Örn: PROJ-123 veya PAY-450)`);
      return;
    }

    const cleanKey = keys[0];

    if (selectedPlatforms.length === 0) {
      setInputError('Lütfen en az bir platform (App, BE, FE) seçin.');
      return;
    }

    setInputError('');
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      if (isDevMode) {
        // Dev modda: tüm story bilgilerini Jira'dan çek, senaryo üretme, direkt oluştur
        const [storyInfos] = await Promise.all([
          Promise.all(
            keys.map((key) =>
              jiraService.fetchStory(key).catch((err) => {
                throw new Error(`${key}: ${err.message || 'Story bilgisi alınamadı.'}`);
              })
            )
          ),
          new Promise((resolve) => setTimeout(resolve, 1400)),
        ]);
        confetti({ particleCount: 70, spread: 75, origin: { y: 0.85 } });
        await onSubtaskCreated({
          stories: keys.map((key, idx) => ({
            storyKey: key,
            storySummary: storyInfos[idx]?.summary,
          })),
          platforms: selectedPlatforms,
          scenarios: {},
          team: selectedTeam,
          isDevMode: true,
        });
        handleReset();
        onClose();
      } else if (!useAi || !getAiConfig().hasToken) {
        // Test modda AI kapalı VEYA kullanıcı token eklememişse: doğrudan boş test subtask'ı aç
        const [storyInfo] = await Promise.all([
          jiraService.fetchStory(cleanKey),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);
        confetti({ particleCount: 70, spread: 75, origin: { y: 0.85 } });
        await onSubtaskCreated({
          storyKey: cleanKey,
          storySummary: storyInfo.summary,
          platforms: selectedPlatforms,
          scenarios: {},
          team: selectedTeam,
          isDevMode: false,
        });
        handleReset();
        onClose();
      } else {
        // Test modda: AI ile senaryo üret (Jira ekli görselleri + kullanıcının eklediği görseli analiz eder)
        const result = await geminiService.generatePlatformScenarios({
          storyKey: cleanKey,
          platforms: selectedPlatforms,
          extraGuidance,
          teamName: selectedTeam,
          customImage,
        });
        setGeneratedResult(result);
      }
    } catch (err) {
      setInputError(err.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
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
    try {
      await onSubtaskCreated({
        storyKey: generatedResult.storyKey,
        storySummary: generatedResult.storySummary,
        platforms: platformsToExport,
        scenarios: generatedResult.scenarios,
        team: selectedTeam,
        isDevMode: false,
      });

      handleReset();
      onClose();
    } catch (err) {
      setInputError(err.message || 'Jira subtask oluşturulamadı.');
    }
  };

  const handleReset = () => {
    setStoryKey('');
    setSelectedPlatforms(isDevMode ? ['BE'] : ['FE', 'BE']);
    setExtraGuidance('');
    if (customImage?.previewUrl) {
      URL.revokeObjectURL(customImage.previewUrl);
    }
    setCustomImage(null);
    setUseAi(false);
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
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs ${isDevMode ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'jira-gradient-bg'}`}>
                {isDevMode ? <Code2 className="w-4 h-4 text-violet-200" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isDevMode ? "Story'e Dev Subtask Oluştur" : "Story'e Test Subtask Oluştur"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isDevMode
                    ? "Yazılımcılar için platforma özgü (App, BE, FE) boş Jira Subtask'ları"
                    : "Platforma özgü (App, BE, FE) test senaryoları ve otomatik Jira Subtask'ları"}
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
                extraGuidance={isDevMode ? null : extraGuidance}
                onExtraGuidanceChange={isDevMode ? null : setExtraGuidance}
                customImage={customImage}
                onCustomImageChange={handleCustomImageChange}
                onRemoveCustomImage={handleRemoveCustomImage}
                inputError={inputError}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                isDevMode={isDevMode}
                useAi={useAi}
                onUseAiChange={(checked) => {
                  setUseAi(checked);
                  // Kullanıcı yapay zeka tikini işaretlediğinde eğer token yoksa popup açılsın
                  if (checked && !getAiConfig().hasToken) {
                    setIsAiModalOpen(true);
                  }
                }}
                onOpenAiModal={() => setIsAiModalOpen(true)}
              />
            )}

            {/* 2. ADIM: YÜKLENİYOR SİMÜLASYONU */}
            {isGenerating && (
              isDevMode || !useAi ? (
                <DevSubtaskLoading 
                  storyKeys={storyKey.split(/[,;\s]+/).map((k) => k.trim().toUpperCase()).filter(Boolean)}
                  selectedPlatforms={selectedPlatforms}
                  variant={isDevMode ? 'dev' : 'test'}
                />
              ) : (
                <GeminiLoading storyKey={storyKey.toUpperCase()} />
              )
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
            {/* Dev modda direkt oluştur butonu konfigürasyon ekranında handleGenerate'e bağlı, bu alan sadece Test modunda görünür */}
            {!isDevMode && useAi && (
              <>
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
                    ? `Her platform için "[Platform] - Ana Story Konusu" adıyla ayrı subtask oluşturulacaktır.`
                    : 'Önce Story No ve Platformları seçip Gemini ile senaryo üretmelisiniz.'}
                </p>
              </>
            )}
            {isDevMode && (
              <p className="text-[11px] text-center text-slate-500">
                Story No(ları) virgülle girip platform seçtikten sonra "Subtask Oluştur" butonuna basın. Her story için ayrı subtask'lar açılır.
              </p>
            )}
            {!isDevMode && !useAi && (
              <p className="text-[11px] text-center text-slate-500">
                Yapay zeka kapalı: seçili her platform için içeriği boş "Test [Platform] - Story Konusu" subtask'ı açılacaktır.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* AI Token Ayar Modalı */}
      <AiTokenModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

    </div>
  );
}
