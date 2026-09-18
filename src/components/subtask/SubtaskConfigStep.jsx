import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Smartphone, 
  Server, 
  Globe, 
  Check,
  Code2,
  FileText
} from 'lucide-react';
import { SAMPLE_STORIES } from '../../constants/jiraConstants';

const AVAILABLE_PLATFORMS = [
  { id: 'App', label: 'App', fullName: 'Mobil Uygulama', tech: 'Appium', icon: Smartphone },
  { id: 'BE', label: 'BE', fullName: 'Backend API', tech: 'RestAssured', icon: Server },
  { id: 'FE', label: 'FE', fullName: 'Frontend Web', tech: 'Playwright', icon: Globe },
];

export default function SubtaskConfigStep({
  storyKey,
  onStoryKeyChange,
  selectedPlatforms,
  onTogglePlatform,
  extraGuidance,
  onExtraGuidanceChange,
  customImage = null,
  onCustomImageChange,
  onRemoveCustomImage,
  inputError,
  onGenerate,
  isGenerating,
  isDevMode = false,
}) {
  const handleQuickPick = (key) => {
    onStoryKeyChange(key);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* 1. Jira Story No */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Jira Story Numarası <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Format: PROJ-123
          </span>
        </div>

        <input
          type="text"
          value={storyKey}
          onChange={(e) => onStoryKeyChange(e.target.value)}
          placeholder="Örn: PROJ-123 veya PAY-450"
          disabled={isGenerating}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
            inputError 
              ? 'border-rose-400 focus:ring-rose-200' 
              : 'border-slate-300 focus:border-jira-500 focus:ring-jira-100'
          } font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:ring-4 transition-all`}
        />

        {inputError && (
          <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{inputError}</span>
          </p>
        )}

        {/* Hızlı Örnek Seçenekleri */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Hızlı Doldur:</span>
          {SAMPLE_STORIES.map((sample) => (
            <button
              key={sample.key}
              type="button"
              onClick={() => handleQuickPick(sample.key)}
              className={`text-xs px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer ${
                storyKey.toUpperCase() === sample.key
                  ? 'bg-jira-600 text-white border-jira-600 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-jira-300 hover:bg-jira-50'
              }`}
            >
              {sample.key}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Platform Çoklu Seçimi (App, BE, FE) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Hedef Platform(lar) <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Birden fazla seçilebilir ({selectedPlatforms.length} seçili)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {AVAILABLE_PLATFORMS.map((plat) => {
            const isSelected = selectedPlatforms.includes(plat.id);
            const Icon = plat.icon;

            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => onTogglePlatform(plat.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-jira-600 bg-jira-50/60 shadow-xs ring-2 ring-jira-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-jira-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-jira-600 border-jira-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {plat.label}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {plat.fullName}
                  </span>
                  <span className="inline-block text-[10px] font-mono text-jira-700 font-semibold mt-1">
                    {plat.tech}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ek Yönlendirme & Ekran Görüntüsü / Tasarım Yükleme (Opsiyonel) */}
      {!isDevMode && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Ek Yönlendirme <span className="text-slate-400 font-normal lowercase">(opsiyonel)</span>
            </label>
            <textarea
              rows={3}
              value={extraGuidance || ''}
              onChange={(e) => onExtraGuidanceChange && onExtraGuidanceChange(e.target.value)}
              placeholder="Örn: Playwright ile yazılacak, sadece edge case'ler ve güvenlik açıkları odaklansın, RestAssured JSONPath doğrulansın..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-jira-500 focus:ring-jira-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* İsteğe Bağlı Ekran Görüntüsü / Tasarım Yükleme */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Ek Görsel / Tasarım (Opsiyonel)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-normal">
                  AI Görsel Analizi
                </span>
              </label>
              <span className="text-[10px] text-slate-400">Jira ekleri de taranır</span>
            </div>

            {!customImage ? (
              <label className="border border-dashed border-slate-300 hover:border-jira-500 bg-white hover:bg-jira-50/20 p-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
                <FileText className="w-4 h-4 text-jira-600" />
                <span className="text-xs font-semibold text-slate-700">
                  Ekran görüntüsü / mockup yükle (PNG, JPG, WEBP)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCustomImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={customImage.previewUrl}
                    alt="Yüklenen Görsel"
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                      {customImage.name}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      Gemini Vision analizine dahil edilecek
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRemoveCustomImage}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                >
                  Kaldır
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aksiyon Butonu */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !storyKey.trim() || selectedPlatforms.length === 0}
          className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed ${
            isDevMode
              ? 'bg-gradient-to-r from-violet-600 to-indigo-700 shadow-indigo-600/20 hover:shadow-indigo-600/30'
              : 'ai-gradient-bg shadow-purple-600/20 hover:shadow-purple-600/30'
          }`}
        >
          {isDevMode
            ? <Code2 className="w-4 h-4 text-violet-200 group-hover:scale-110 transition-transform" />
            : <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          }
          <span>{isDevMode ? 'Subtask Oluştur' : 'Gemini ile Senaryo Üret'}</span>
          <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
