/**
 * @module components/bug/BugDrawer
 *
 * Refactored Bug/Issue creation drawer.
 * Uses: DrawerShell, FileUploadZone, useFileUpload, useDrawerForm, ErrorBanner.
 * Reduced from 689 lines → ~220 lines.
 */

import React, { useState, useCallback } from 'react';
import { Bug, FileCheck, Sparkles, Send, Users, ImageIcon, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTeamJiraMapping } from '../../constants/jiraConstants';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDrawerForm } from '../../hooks/useDrawerForm';
import DrawerShell from '../shared/DrawerShell';
import FileUploadZone from '../shared/FileUploadZone';
import ErrorBanner from '../shared/ErrorBanner';
import { BUG_INITIAL_STATE } from '../../schemas/formSchemas';
import { BUG_SEVERITY } from '../../schemas/dropdownOptions';

const MAX_NOTES_LENGTH = 3000;

export default function BugDrawer({ isOpen, onClose, selectedTeam = 'Search', onBugCreated }) {
  const [type, setType] = useState('issue');
  const [storyKey, setStoryKey] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedData, setGeneratedData] = useState({ ...BUG_INITIAL_STATE });

  const fileUpload = useFileUpload({ maxSizeMb: 10 });

  const resetCallback = useCallback(() => {
    setType('issue');
    setStoryKey('');
    setNotes('');
    setGeneratedData({ ...BUG_INITIAL_STATE });
    fileUpload.resetAll();
  }, [fileUpload]);

  const { step, setStep, isGenerating, isSubmitting, error, setError, resetForm, withGenerating, withSubmitting } =
    useDrawerForm({ isOpen, onResetCallback: resetCallback });

  // Step 1 → Step 2: Gemini AI analysis
  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError('Not alanı zorunludur. Lütfen karşılaşılan hatayı veya sorunu detaylıca açıklayın.');
      return;
    }
    if (type === 'issue') {
      const cleanStory = storyKey.trim().toUpperCase();
      if (!cleanStory) { setError('Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin'); return; }
      try {
        await jiraService.validateStoryKey(cleanStory);
      } catch (valErr) {
        setError(valErr.message || 'Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin');
        return;
      }
    }

    await withGenerating(async () => {
      let storyData = null;
      if (type === 'issue' && storyKey.trim()) {
        try { storyData = await jiraService.fetchStory(storyKey.trim().toUpperCase()); } catch (e) { /* continue without story data */ }
      }

      const result = await geminiService.generateBugOrIssueDetails({
        type,
        notes: notes.trim(),
        storyKey: type === 'issue' ? storyKey.trim().toUpperCase() : '',
        storyData,
        teamName: selectedTeam,
        images: fileUpload.images,
      });

      setGeneratedData({
        summary: result.summary || `[${type.toUpperCase()}] [${selectedTeam}] Hata Kaydı`,
        stepsToReproduce: Array.isArray(result.stepsToReproduce) ? result.stepsToReproduce : ['1. Sayfayı açın', '2. İşlemi gerçekleştirin'],
        actualResult: result.actualResult || notes.trim(),
        expectedResult: result.expectedResult || 'İşlemin başarıyla tamamlanması beklenir.',
        environment: result.environment || 'Web / Mobile / Test Ortamı',
        severity: result.severity || 'Major',
      });
    });
  };

  // Step 2 → Jira
  const handleCreateInJira = async () => {
    const isIssue = type === 'issue';
    await withSubmitting(async () => {
      const formattedDesc = `h2. 🚨 Hata Açıklaması & Tespit
${generatedData.actualResult || '-'}

h2. 🎯 Beklenen Sonuç (Expected Result)
${generatedData.expectedResult || '-'}

h2. 🔄 Tekrarlama Adımları (Steps to Reproduce)
${generatedData.stepsToReproduce.map((s, i) => `* ${i + 1}. ${s}`).join('\n') || '-'}

h2. 💻 Ortam & Cihaz Bilgisi
* *Ortam:* ${generatedData.environment || 'Test Ortamı'}
* *Önem Derecesi:* ${generatedData.severity || 'Major'}
* *Takım:* ${selectedTeam}
${isIssue && storyKey ? `* *Bağlı Story:* ${storyKey.trim().toUpperCase()}` : ''}`.trim();

      const response = await jiraService.createBugOrIssue({
        type,
        summary: generatedData.summary,
        description: formattedDesc,
        storyKey: isIssue ? storyKey.trim().toUpperCase() : null,
        team: selectedTeam,
        attachments: fileUpload.getAllAttachments(),
      });

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.85 } });
      onBugCreated?.(response);
      resetForm();
      onClose();
    });
  };

  const handleClose = () => { resetForm(); onClose(); };

  const drawerIcon = (
    <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
      <Bug className="w-5 h-5 text-rose-200" />
    </div>
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Issue / Bug Oluştur"
      subtitle="Story bağlantılı Issue veya bağımsız Bug kaydı oluşturma ve ek yükleme"
      icon={drawerIcon}
      showReset={step === 2}
      onReset={() => setStep(1)}
      maxWidth="max-w-4xl"
    >
      {/* Type Selector: Issue vs Bug */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1.5 max-w-md mx-auto border border-slate-200">
        <button onClick={() => { setType('issue'); setError(null); }} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${type === 'issue' ? 'bg-white text-rose-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
          <FileCheck className="w-3.5 h-3.5" /> Seçenek 1: Story'e Bağlı Issue
        </button>
        <button onClick={() => { setType('bug'); setError(null); }} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${type === 'bug' ? 'bg-white text-rose-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
          <Bug className="w-3.5 h-3.5" /> Seçenek 2: Bağımsız Bug
        </button>
      </div>

      <ErrorBanner error={error || fileUpload.uploadError} onDismiss={() => { setError(null); fileUpload.setUploadError(null); }} />

      {/* STEP 1: Input */}
      {step === 1 && (
        <div className="space-y-5 max-w-2xl mx-auto bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
          {/* Team Badge */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600"><Users className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Takım / Board</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{selectedTeam}</span>
                  {getTeamJiraMapping(selectedTeam).component && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-mono font-medium border border-rose-200">
                      {getTeamJiraMapping(selectedTeam).component}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">MP TEAM: {getTeamJiraMapping(selectedTeam).mpTeam || selectedTeam}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold uppercase">{type === 'issue' ? 'Story Issue' : 'Bug Kaydı'}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Jira Entegre</p>
            </div>
          </div>

          {/* Story Key (only for Issue type) */}
          {type === 'issue' && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>1. Bağlı Story Numarası *</span>
                <span className="text-[10px] text-amber-700 font-semibold font-mono">Zorunlu Alan</span>
              </label>
              <input type="text" value={storyKey} onChange={(e) => setStoryKey(e.target.value.toUpperCase())} placeholder="Örn: SCRUM-5 veya MP-123" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 font-mono text-sm font-semibold uppercase bg-white" />
              <p className="text-[11px] text-slate-500">Açılacak Issue bu Story numarasına doğrudan bağlanacak ve story içinde listelenecektir.</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{type === 'issue' ? '2.' : '1.'} Hata / Sorun Notu (Zorunlu) *</label>
              <span className={`text-[11px] font-mono font-semibold ${notes.length >= MAX_NOTES_LENGTH ? 'text-rose-600' : 'text-slate-400'}`}>{notes.length} / {MAX_NOTES_LENGTH}</span>
            </div>
            <textarea rows={4} maxLength={MAX_NOTES_LENGTH} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={type === 'issue' ? "Story kapsamında bulunan hatayı detaylıca açıklayın..." : "Sistemde karşılaşılan hatayı, adımları ve beklenen davranışı yazın..."} className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm leading-relaxed bg-white" />
          </div>

          {/* File Upload Zone (shared component) */}
          <FileUploadZone
            images={fileUpload.images}
            files={fileUpload.files}
            onImageUpload={fileUpload.handleImageUpload}
            onFileUpload={fileUpload.handleFileUpload}
            onRemoveImage={fileUpload.removeImage}
            onRemoveFile={fileUpload.removeFile}
            imageLabel="Ekran Görüntüsü / Hata Görseli (İsteğe Bağlı)"
            fileLabel="Hata Logu / Doküman (İsteğe Bağlı)"
          />

          {/* Generate Button */}
          <div className="pt-3">
            <button type="button" onClick={handleGenerate} disabled={isGenerating || !notes.trim() || (type === 'issue' && !storyKey.trim())} className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-rose-600 to-red-600 shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Gemini AI Hata Analizi Yapıyor...' : type === 'issue' ? 'Story Issue Formatı Oluştur' : 'Bug Kaydı Formatı Oluştur'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Edit */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-2 text-xs text-rose-800">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{type === 'issue' ? `Story (${storyKey.toUpperCase()}) bağlantılı Issue formatı oluşturuldu.` : 'Bağımsız Bug kaydı oluşturuldu.'} Düzenleyip Jira'ya gönderebilirsiniz.</span>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hata / Issue Başlığı *</label>
            <input type="text" value={generatedData.summary} onChange={(e) => setGeneratedData((p) => ({ ...p, summary: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 font-semibold text-sm text-slate-900 bg-white" />
          </div>

          {/* Actual Result */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Karşılaşılan Durum (Actual Result)</label>
            <textarea rows={3} value={generatedData.actualResult} onChange={(e) => setGeneratedData((p) => ({ ...p, actualResult: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-xs leading-relaxed bg-white" />
          </div>

          {/* Expected Result */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Beklenen Davranış (Expected Result)</label>
            <textarea rows={2} value={generatedData.expectedResult} onChange={(e) => setGeneratedData((p) => ({ ...p, expectedResult: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-xs leading-relaxed bg-white" />
          </div>

          {/* Environment & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ortam / Cihaz</label>
              <input type="text" value={generatedData.environment} onChange={(e) => setGeneratedData((p) => ({ ...p, environment: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Önem Derecesi</label>
              <select value={generatedData.severity} onChange={(e) => setGeneratedData((p) => ({ ...p, severity: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold">
                {BUG_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Attachment Summary */}
          {(fileUpload.images.length > 0 || fileUpload.files.length > 0) && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1.5">Jira'ya Yüklenecek Ekler ({fileUpload.images.length + fileUpload.files.length} Adet):</span>
              <div className="flex flex-wrap gap-2">
                {fileUpload.images.map((img, i) => (<span key={`img-${i}`} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-700"><ImageIcon className="w-3 h-3 text-rose-600" />{img.name}</span>))}
                {fileUpload.files.map((f, i) => (<span key={`file-${i}`} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-700"><Paperclip className="w-3 h-3 text-slate-500" />{f.name}</span>))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">Geri Dön</button>
            <button type="button" onClick={handleCreateInJira} disabled={isSubmitting || !generatedData.summary.trim()} className="px-5 py-2.5 rounded-xl text-white font-bold text-xs bg-rose-600 hover:bg-rose-700 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Jira'ya Yükleniyor..." : type === 'issue' ? "Jira'da Issue Oluştur" : "Jira'da Bug Oluştur"}</span>
            </button>
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
