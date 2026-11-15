/**
 * @module components/poker/PlanningPokerDrawer
 *
 * Planning Poker Story Point estimation drawer powered by Gemini AI.
 * Analyzes technical complexity, QA effort, and risks/dependencies.
 * Allows team members to review AI recommendations, edit the story points,
 * and push the selected points directly to Jira.
 */

import React, { useState, useCallback } from 'react';
import { Calculator, Sparkles, Send, Users, FileCheck, Layers, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTeamJiraMapping } from '../../constants/jiraConstants';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDrawerForm } from '../../hooks/useDrawerForm';
import DrawerShell from '../shared/DrawerShell';
import FileUploadZone from '../shared/FileUploadZone';
import ErrorBanner from '../shared/ErrorBanner';

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 20, 40, 100];
const MAX_DESCRIPTION_LENGTH = 3000;

export default function PlanningPokerDrawer({ isOpen, onClose, selectedTeam = 'Search', onPokerCompleted }) {
  const [mode, setMode] = useState('jira'); // 'jira' | 'custom'
  const [storyKey, setStoryKey] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Step 2 State
  const [estimationData, setEstimationData] = useState({
    storyKey: '',
    storyPoint: 3,
    technicalComplexity: '',
    qaEffort: '',
    risksAndDependencies: '',
    reasoning: [],
  });

  const [selectedPoint, setSelectedPoint] = useState(3);

  const fileUpload = useFileUpload({ maxSizeMb: 10 });

  const resetCallback = useCallback(() => {
    setMode('jira');
    setStoryKey('');
    setCustomTitle('');
    setCustomDescription('');
    setEstimationData({
      storyKey: '',
      storyPoint: 3,
      technicalComplexity: '',
      qaEffort: '',
      risksAndDependencies: '',
      reasoning: [],
    });
    setSelectedPoint(3);
    fileUpload.resetAll();
  }, [fileUpload]);

  const { step, setStep, isGenerating, isSubmitting, error, setError, resetForm, withGenerating, withSubmitting } =
    useDrawerForm({ isOpen, onResetCallback: resetCallback });

  // Step 1 → Step 2: Gemini AI Analysis
  const handleGenerate = async () => {
    if (mode === 'jira') {
      const cleanKey = storyKey.trim().toUpperCase();
      if (!cleanKey) {
        setError('Lütfen geçerli bir Jira Story numarası girin (örn: SCRUM-5 veya MP-123).');
        return;
      }
      try {
        await jiraService.validateStoryKey(cleanKey);
      } catch (valErr) {
        setError(valErr.message || 'Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin');
        return;
      }
    } else {
      if (!customTitle.trim() && !customDescription.trim() && fileUpload.images.length === 0) {
        setError('Lütfen bir başlık, açıklama yazın veya analiz edilecek görselleri yükleyin.');
        return;
      }
    }

    await withGenerating(async () => {
      const cleanKey = storyKey.trim().toUpperCase();
      const result = await geminiService.generatePlanningPokerEstimation({
        mode,
        storyKey: mode === 'jira' ? cleanKey : '',
        customTitle,
        customDescription,
        teamName: selectedTeam,
        images: fileUpload.images,
        files: fileUpload.files,
      });

      setEstimationData({
        storyKey: mode === 'jira' ? cleanKey : storyKey,
        storyPoint: result.storyPoint,
        technicalComplexity: result.technicalComplexity,
        qaEffort: result.qaEffort,
        risksAndDependencies: result.risksAndDependencies,
        reasoning: result.reasoning || [],
      });
      setSelectedPoint(result.storyPoint);
    });
  };

  // Step 2 → Jira: Save Story Point
  const handleSaveToJira = async () => {
    const targetKey = estimationData.storyKey || storyKey.trim().toUpperCase();
    if (!targetKey) {
      setError('Story numarası belirtilmedi. Puan Jira kaydına aktarılamıyor.');
      return;
    }

    await withSubmitting(async () => {
      const response = await jiraService.updateStoryPoints(targetKey, selectedPoint);

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.85 } });
      onPokerCompleted?.(response);
      resetForm();
      onClose();
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const drawerIcon = (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
      <Calculator className="w-5 h-5 text-amber-100" />
    </div>
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Planning Poker Tahminleme & Efor Analizi"
      subtitle="Scrum Master ve QA Mimar AI ile Story Point (Fibonacci) ve teknik karmaşıklık analizi"
      icon={drawerIcon}
      showReset={step === 2}
      onReset={() => setStep(1)}
      maxWidth="max-w-4xl"
    >
      {/* Mode Selector */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1.5 max-w-md mx-auto border border-slate-200 mb-4">
        <button
          onClick={() => { setMode('jira'); setError(null); }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'jira'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" /> Jira Story Numarası İle
        </button>
        <button
          onClick={() => { setMode('custom'); setError(null); }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'custom'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Manuel Detay & Görsel İle
        </button>
      </div>

      <ErrorBanner
        error={error || fileUpload.uploadError}
        onDismiss={() => { setError(null); fileUpload.setUploadError(null); }}
      />

      {/* STEP 1: Input */}
      {step === 1 && (
        <div className="space-y-5 max-w-2xl mx-auto bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
          {/* Team Info */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Takım</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{selectedTeam}</span>
                  {getTeamJiraMapping(selectedTeam).component && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-mono font-medium border border-amber-200">
                      {getTeamJiraMapping(selectedTeam).component}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">MP TEAM: {getTeamJiraMapping(selectedTeam).mpTeam || selectedTeam}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold uppercase">
                Planning Poker
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Agile & Fibonacci Serisi (1-100)</p>
            </div>
          </div>

          {mode === 'jira' ? (
            /* Jira Story Key Input */
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Jira Story Numarası *</span>
                <span className="text-[10px] text-emerald-700 font-semibold font-mono">Zorunlu Alan</span>
              </label>
              <input
                type="text"
                value={storyKey}
                onChange={(e) => setStoryKey(e.target.value.toUpperCase())}
                placeholder="Örn: SCRUM-5 veya MP-123"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono text-sm font-semibold uppercase bg-white"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jira'daki Story başlığı, açıklaması, kabul kriterleri ve ekli görseller otomatik çekilerek teknik efor analizi yapılacaktır.
              </p>
            </div>
          ) : (
            /* Custom Form Input */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Story / Geliştirme Başlığı
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Örn: Sepet Akışına Çoklu Kupon Kodu Desteği Eklenmesi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    İş Tanımı & Kabul Kriterleri Notları
                  </label>
                  <span className={`text-[11px] font-mono font-semibold ${customDescription.length >= MAX_DESCRIPTION_LENGTH ? 'text-rose-600' : 'text-slate-400'}`}>
                    {customDescription.length} / {MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Teknik detayları, yapılmak istenen işi, veritabanı veya servis değişikliklerini buraya yazın..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm leading-relaxed bg-white"
                />
              </div>

              {/* Optional Jira Story Link if custom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  İlişkili Jira Story Numarası (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={storyKey}
                  onChange={(e) => setStoryKey(e.target.value.toUpperCase())}
                  placeholder="Örn: SCRUM-5 (Puan doğrudan bu bilete girilebilir)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase bg-white"
                />
              </div>
            </div>
          )}

          {/* File Upload Zone */}
          <FileUploadZone
            images={fileUpload.images}
            files={fileUpload.files}
            onImageUpload={fileUpload.handleImageUpload}
            onFileUpload={fileUpload.handleFileUpload}
            onRemoveImage={fileUpload.removeImage}
            onRemoveFile={fileUpload.removeFile}
            imageLabel="Ekran Görüntüsü / Mimari / Akış Görseli"
            fileLabel="Doküman / Şartname Dosyası (Opsiyonel)"
          />

          {/* Generate Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'jira' ? !storyKey.trim() : (!customTitle.trim() && !customDescription.trim() && fileUpload.images.length === 0))}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Scrum AI Efor ve Riski Analiz Ediyor...' : 'Planning Poker Tahminini Hesapla'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Poker Result & Editing */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                {estimationData.storyPoint}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  Scrum Master AI Değerlendirmesi
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Önerilen Tahmin: <span className="text-emerald-700 font-extrabold">{estimationData.storyPoint} Story Point</span>
                </h3>
              </div>
            </div>

            {estimationData.storyKey && (
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-lg border border-emerald-300 text-slate-800 shadow-2xs">
                  {estimationData.storyKey}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Fibonacci Story Point Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Ekip Kararı / Seçilen Story Point: <span className="text-emerald-700 font-extrabold text-sm">{selectedPoint} SP</span>
              </label>
              <span className="text-[11px] text-slate-400">
                (Beğenilen puanı seçebilir veya değiştirebilirsiniz)
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {FIBONACCI_POINTS.map((pt) => {
                const isAIRecommended = pt === estimationData.storyPoint;
                const isSelected = pt === selectedPoint;

                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setSelectedPoint(pt)}
                    className={`relative py-3.5 px-2 rounded-xl border-2 font-black text-lg transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md scale-105'
                        : isAIRecommended
                        ? 'border-amber-400 bg-amber-50 text-slate-800 hover:border-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span>{pt}</span>
                    {isAIRecommended && (
                      <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-700 text-amber-200' : 'bg-amber-200 text-amber-900'}`}>
                        AI Önerisi
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reasoning & Criteria Analysis */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Puanlama Gerekçesi ve Efor Analizi</span>
            </h4>

            <div className="space-y-3">
              {/* Technical Complexity */}
              {estimationData.technicalComplexity && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-xs leading-relaxed space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    1. Teknik Karmaşıklık (Frontend, Backend, DB)
                  </div>
                  <p className="text-slate-600 pl-3.5">{estimationData.technicalComplexity}</p>
                </div>
              )}

              {/* QA Effort */}
              {estimationData.qaEffort && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-xs leading-relaxed space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    2. Test ve QA Eforu (Senaryolar & Regresyon)
                  </div>
                  <p className="text-slate-600 pl-3.5">{estimationData.qaEffort}</p>
                </div>
              )}

              {/* Risks & Unknowns */}
              {estimationData.risksAndDependencies && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-xs leading-relaxed space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    3. Bilinmeyenler, Riskler ve Bağımlılıklar
                  </div>
                  <p className="text-slate-600 pl-3.5">{estimationData.risksAndDependencies}</p>
                </div>
              )}

              {/* Bulleted reasoning if available */}
              {estimationData.reasoning && estimationData.reasoning.length > 0 && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900">Özet Gerekçe Maddeleri:</div>
                  <ul className="space-y-1 text-slate-700 pl-1">
                    {estimationData.reasoning.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Geri Dön / Yeniden İncele
            </button>
            <button
              type="button"
              onClick={handleSaveToJira}
              disabled={isSubmitting || !estimationData.storyKey}
              className="px-6 py-3 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Jira'da Puan Güncelleniyor..."
                  : `Jira'da Puanı Gir (${selectedPoint} SP)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
