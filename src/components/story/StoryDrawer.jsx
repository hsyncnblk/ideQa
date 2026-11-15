/**
 * @module components/story/StoryDrawer
 *
 * Refactored Story creation drawer.
 * Uses: DrawerShell, FileUploadZone, useFileUpload, useDrawerForm, ErrorBanner.
 * Reduced from 618 lines → ~200 lines by extracting shared logic and UI.
 */

import React, { useState, useCallback } from 'react';
import { FileText, Sparkles, Send, RotateCcw, Users, Plus, Trash2, ImageIcon, Paperclip } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTeamJiraMapping } from '../../constants/jiraConstants';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDrawerForm } from '../../hooks/useDrawerForm';
import DrawerShell from '../shared/DrawerShell';
import FileUploadZone from '../shared/FileUploadZone';
import ErrorBanner from '../shared/ErrorBanner';
import { STORY_INITIAL_STATE } from '../../schemas/formSchemas';

const MAX_TEXT_LENGTH = 3000;

export default function StoryDrawer({ isOpen, onClose, selectedTeam = 'Search', onStoryCreated }) {
  const [description, setDescription] = useState('');
  const [generatedStory, setGeneratedStory] = useState({ ...STORY_INITIAL_STATE });

  const fileUpload = useFileUpload({ maxSizeMb: 10 });

  const resetCallback = useCallback(() => {
    setDescription('');
    setGeneratedStory({ ...STORY_INITIAL_STATE });
    fileUpload.resetAll();
  }, [fileUpload]);

  const { step, setStep, isGenerating, isSubmitting, error, setError, resetForm, withGenerating, withSubmitting } =
    useDrawerForm({ isOpen, onResetCallback: resetCallback });

  // Step 1 → Step 2: Gemini AI analysis
  const handleGenerate = async () => {
    if (!description.trim() && fileUpload.images.length === 0 && fileUpload.files.length === 0) {
      setError('Lütfen bir açıklama yazın veya analiz edilmesi için görsel/doküman yükleyin.');
      return;
    }

    await withGenerating(async () => {
      const result = await geminiService.generateStoryDetails({
        description,
        teamName: selectedTeam,
        images: fileUpload.images,
        files: fileUpload.files,
      });
      setGeneratedStory({
        summary: result.summary || `[${selectedTeam}] Yeni Geliştirme Talebi`,
        userStory: result.userStory || '',
        background: result.background || '',
        acceptanceCriteria: Array.isArray(result.acceptanceCriteria) ? result.acceptanceCriteria : [],
        technicalNotes: result.technicalNotes || '',
      });
    });
  };

  // Acceptance criteria management
  const handleCriteriaChange = (index, value) => {
    setGeneratedStory((prev) => {
      const updated = [...prev.acceptanceCriteria];
      updated[index] = value;
      return { ...prev, acceptanceCriteria: updated };
    });
  };
  const addCriteria = () => setGeneratedStory((prev) => ({ ...prev, acceptanceCriteria: [...prev.acceptanceCriteria, 'Yeni kabul kriteri'] }));
  const removeCriteria = (index) => setGeneratedStory((prev) => ({ ...prev, acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index) }));

  // Step 2 → Jira
  const handleCreateInJira = async () => {
    await withSubmitting(async () => {
      const formattedDesc = `h2. 📌 Kullanıcı Hikayesi (User Story)
${generatedStory.userStory || '-'}

h2. 🎯 Arka Plan & İhtiyaç (Background)
${generatedStory.background || '-'}

h2. ⚡ Kabul Kriterleri (Acceptance Criteria)
${generatedStory.acceptanceCriteria.map((ac, idx) => `* ${idx + 1}. ${ac}`).join('\n') || '-'}

${generatedStory.technicalNotes ? `h2. ⚙️ Teknik Notlar & Mimari\n${generatedStory.technicalNotes}` : ''}`.trim();

      const response = await jiraService.createStory({
        summary: generatedStory.summary,
        description: formattedDesc,
        team: selectedTeam,
        attachments: fileUpload.getAllAttachments(),
      });

      confetti({ particleCount: 80, spread: 80, origin: { y: 0.85 } });
      onStoryCreated?.(response);
      resetForm();
      onClose();
    });
  };

  const handleClose = () => { resetForm(); onClose(); };

  const drawerIcon = (
    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
      <FileText className="w-5 h-5 text-blue-200" />
    </div>
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Jira Backlog'a Story Oluştur"
      subtitle="Görsel ve dosya analizi ile otomatik kullanıcı hikayesi ve kabul kriteri çıkarma"
      icon={drawerIcon}
      showReset={step === 2}
      onReset={() => setStep(1)}
      maxWidth="max-w-4xl"
    >
      <ErrorBanner error={error || fileUpload.uploadError} onDismiss={() => { setError(null); fileUpload.setUploadError(null); }} />

      {/* STEP 1: Input */}
      {step === 1 && (
        <div className="space-y-5 max-w-2xl mx-auto bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
          {/* Team Badge */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Takım / Board</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{selectedTeam}</span>
                  {getTeamJiraMapping(selectedTeam).component && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-medium border border-blue-200">
                      {getTeamJiraMapping(selectedTeam).component}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">MP TEAM: {getTeamJiraMapping(selectedTeam).mpTeam || selectedTeam}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">otomasyon_ai</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Jira Backlog</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Talep Açıklaması / Geliştirme Notları</label>
              <span className={`text-[11px] font-mono font-semibold ${description.length >= MAX_TEXT_LENGTH ? 'text-rose-600' : 'text-slate-400'}`}>
                {description.length} / {MAX_TEXT_LENGTH} karakter
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={MAX_TEXT_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kullanıcıların neye ihtiyaç duyduğunu, iş hedefini veya ekran gereksinimlerini buraya yazın..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm leading-relaxed bg-white"
            />
          </div>

          {/* File Upload Zone (shared component) */}
          <FileUploadZone
            images={fileUpload.images}
            files={fileUpload.files}
            onImageUpload={fileUpload.handleImageUpload}
            onFileUpload={fileUpload.handleFileUpload}
            onRemoveImage={fileUpload.removeImage}
            onRemoveFile={fileUpload.removeFile}
            imageLabel="Görsel / Tasarım / Mockup Yükle"
            fileLabel="Doküman / Şartname Dosyası (Opsiyonel)"
          />

          {/* Generate Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (!description.trim() && fileUpload.images.length === 0 && fileUpload.files.length === 0)}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Gemini Vision Analiz Ediyor...' : 'Gemini ile Story & Kabul Kriterleri Üret'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Edit */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-2 text-xs text-blue-800">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Gemini Vision görsellerinizi ve açıklamanızı analiz ederek aşağıdaki Story ve Kabul Kriterlerini oluşturdu. Dilediğiniz alanı düzenleyip Jira Backlog'a aktarabilirsiniz.</span>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Story Başlığı (Summary) *</label>
            <input type="text" value={generatedStory.summary} onChange={(e) => setGeneratedStory((p) => ({ ...p, summary: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold text-sm text-slate-900 bg-white" />
          </div>

          {/* User Story */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kullanıcı Hikayesi (User Story)</label>
            <textarea rows={3} value={generatedStory.userStory} onChange={(e) => setGeneratedStory((p) => ({ ...p, userStory: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-mono leading-relaxed bg-white" />
          </div>

          {/* Background */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Arka Plan & Geliştirme Nedeni</label>
            <textarea rows={2} value={generatedStory.background} onChange={(e) => setGeneratedStory((p) => ({ ...p, background: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs leading-relaxed bg-white" />
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kabul Kriterleri - {generatedStory.acceptanceCriteria.length} Adet</label>
              <button type="button" onClick={addCriteria} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Kriter Ekle
              </button>
            </div>
            <div className="space-y-2">
              {generatedStory.acceptanceCriteria.map((ac, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">{idx + 1}</span>
                  <textarea rows={2} value={ac} onChange={(e) => handleCriteriaChange(idx, e.target.value)} className="flex-1 p-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:border-blue-500 focus:outline-none" />
                  <button type="button" onClick={() => removeCriteria(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Attachment Summary */}
          {(fileUpload.images.length > 0 || fileUpload.files.length > 0) && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-1.5">Jira Story'sine Yüklenecek Ekler:</span>
              <div className="flex flex-wrap gap-2">
                {fileUpload.images.map((img, i) => (
                  <span key={`img-${i}`} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-700"><ImageIcon className="w-3 h-3 text-blue-600" />{img.name}</span>
                ))}
                {fileUpload.files.map((file, i) => (
                  <span key={`file-${i}`} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-1 rounded border border-slate-200 text-slate-700"><Paperclip className="w-3 h-3 text-slate-500" />{file.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">Geri Dön</button>
            <button type="button" onClick={handleCreateInJira} disabled={isSubmitting || !generatedStory.summary.trim()} className="px-5 py-2.5 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Jira Backlog'a Yükleniyor..." : "Jira Backlog'a Story Oluştur"}</span>
            </button>
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
