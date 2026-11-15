/**
 * @module components/ipk/IpkDrawer
 *
 * Refactored IPK Demand creation drawer.
 * Uses: DrawerShell, FileUploadZone, DynamicFormRenderer, useFileUpload, useDrawerForm, ErrorBanner.
 * Dropdown options come from schemas/dropdownOptions.js.
 * Form structure comes from schemas/formSchemas.js.
 * Reduced from 1172 lines → ~280 lines.
 */

import React, { useState, useCallback } from 'react';
import {
  FileCheck2,
  Sparkles,
  Search,
  Type,
  Send,
  UploadCloud,
  ImageIcon,
  Trash2,
  Layers,
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useDrawerForm } from '../../hooks/useDrawerForm';
import DrawerShell from '../shared/DrawerShell';
import FileUploadZone from '../shared/FileUploadZone';
import DynamicFormRenderer from '../shared/DynamicFormRenderer';
import ErrorBanner from '../shared/ErrorBanner';
import { IPK_FORM_SCHEMA, IPK_INITIAL_STATE } from '../../schemas/formSchemas';

const MAX_TEXT_LENGTH = 2000;

export default function IpkDrawer({ isOpen, onClose, selectedTeam = 'Search', onIpkCreated }) {
  const [mode, setMode] = useState('story');
  const [storyKey, setStoryKey] = useState('SCRUM-5');
  const [storyExtraGuidance, setStoryExtraGuidance] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState('genel');
  const [ipkForm, setIpkForm] = useState(() => JSON.parse(JSON.stringify(IPK_INITIAL_STATE)));

  const fileUpload = useFileUpload({ maxSizeMb: 15, maxFiles: 10 });

  const resetCallback = useCallback(() => {
    setMode('story');
    setStoryKey('SCRUM-5');
    setStoryExtraGuidance('');
    setTextDescription('');
    setActiveTab('genel');
    setIpkForm(JSON.parse(JSON.stringify(IPK_INITIAL_STATE)));
    if (imageFile?.previewUrl) URL.revokeObjectURL(imageFile.previewUrl);
    setImageFile(null);
    fileUpload.resetAll();
  }, [imageFile, fileUpload]);

  const { step, setStep, isGenerating, isSubmitting, error, setError, resetForm, withGenerating, withSubmitting } =
    useDrawerForm({ isOpen, onResetCallback: resetCallback });

  // Single image upload for text mode
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 5) { setError(`Görsel boyutu maksimum 5 MB olabilir.`); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile({
        name: file.name,
        sizeMb: sizeMb.toFixed(2),
        mimeType: file.type || 'image/png',
        base64: reader.result.split(',')[1],
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAiImage = () => {
    if (imageFile?.previewUrl) URL.revokeObjectURL(imageFile.previewUrl);
    setImageFile(null);
  };

  // Step 1 → Step 2: Gemini AI
  const handleGenerate = async () => {
    if (mode === 'story') {
      const cleanKey = storyKey.trim().toUpperCase();
      if (!cleanKey) {
        setError('Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin');
        return;
      }
      try {
        await jiraService.validateStoryKey(cleanKey);
      } catch (valErr) {
        setError(valErr.message || 'Girilen Story ID Jira üzerinde bulunamadı, lütfen kontrol edin');
        return; // Flow lock: stop execution immediately!
      }
    }
    if (mode === 'text' && !textDescription.trim() && !imageFile) {
      setError('Lütfen talep açıklamasını veya bir görsel yükleyin.');
      return;
    }

    await withGenerating(async () => {
      const result = await geminiService.generateIpkDemand({
        mode,
        storyKey: mode === 'story' ? storyKey.trim() : '',
        extraGuidance: mode === 'story' ? storyExtraGuidance.trim() : '',
        textDescription: mode === 'text' ? textDescription.trim() : '',
        imageFile: mode === 'text' ? imageFile : null,
        teamName: selectedTeam,
      });

      if (result?.data) {
        setIpkForm({
          assignee: 'hsyn deneme',
          labels: ['otomasyon_ai'],
          genel: { ...ipkForm.genel, ...(result.data.genel || {}) },
          etki_kapsami: { ...ipkForm.etki_kapsami, ...(result.data.etki_kapsami || {}) },
          finansal_etki: { ...ipkForm.finansal_etki, ...(result.data.finansal_etki || {}) },
        });
      }
    });
  };

  // Schema-driven field change handler
  const handleFieldChange = (sectionKey, fieldKey, value) => {
    setIpkForm((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }));
  };

  // Submit to Jira
  const handleSubmitToJira = async () => {
    await withSubmitting(async () => {
      const result = await jiraService.createIpkDemand({
        ipkData: ipkForm,
        storyKey: mode === 'story' ? storyKey.trim() : null,
        attachments: fileUpload.getAllAttachments(),
        team: selectedTeam,
      });
      onIpkCreated?.(result);
      resetForm();
      onClose();
    });
  };

  const handleClose = () => { resetForm(); onClose(); };

  const drawerIcon = (
    <div className="w-10 h-10 rounded-xl bg-jira-600 flex items-center justify-center text-amber-300 shadow-md">
      <FileCheck2 className="w-5 h-5" />
    </div>
  );

  // Form tab definitions from schema
  const tabs = IPK_FORM_SCHEMA.sections.map((s) => ({ key: s.key, label: s.label }));

  const footer = step === 2 ? (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={handleSubmitToJira}
        disabled={isSubmitting || !ipkForm.genel?.summary?.trim()}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          !isSubmitting && ipkForm.genel?.summary?.trim()
            ? 'jira-gradient-bg text-white shadow-md shadow-jira-600/25 hover:shadow-jira-600/35 hover:brightness-105 active:scale-[0.99] cursor-pointer'
            : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        <span>{isSubmitting ? 'Jira IPK Demand Oluşturuluyor...' : "Jira'ya IPK Demand Oluştur"}</span>
      </button>
      <p className="text-[11px] text-center text-slate-500">
        IPK Demand kaydı Jira'da Task olarak oluşturulacak ve eklenen dosyalar yüklenecektir.
      </p>
    </div>
  ) : null;

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={handleClose}
      title="İPK (İdefix Portfolio Kanban) Demand Asistanı"
      subtitle="AI destekli otomatik Talep (Demand) formu oluşturma ve Jira entegrasyonu"
      icon={drawerIcon}
      showReset={step === 2}
      onReset={resetForm}
      maxWidth="max-w-4xl"
      footer={footer}
    >
      <ErrorBanner error={error || fileUpload.uploadError} onDismiss={() => { setError(null); fileUpload.setUploadError(null); }} />

      {/* STEP 1: Input Selection */}
      {step === 1 && (
        <div className="space-y-5 max-w-2xl mx-auto bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
          {/* Mode Switch */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200">
            <button onClick={() => { setMode('story'); setError(null); }} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'story' ? 'bg-white text-jira-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
              <Search className="w-3.5 h-3.5" /> Jira Story'den Üret
            </button>
            <button onClick={() => { setMode('text'); setError(null); }} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${mode === 'text' ? 'bg-white text-jira-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
              <Type className="w-3.5 h-3.5" /> Açıklama / Görsel ile Üret
            </button>
          </div>

          {/* Mode: Story */}
          {mode === 'story' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jira Story No *</label>
                <input
                  type="text"
                  value={storyKey}
                  onChange={(e) => {
                    setStoryKey(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder="Örn: SCRUM-5"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    error ? 'border-rose-500 focus:ring-2 focus:ring-rose-100' : 'border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100'
                  } font-mono text-sm font-semibold uppercase bg-white`}
                />
                {error && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    {error}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ek Not / Yönlendirme (İsteğe Bağlı)</label>
                <textarea rows={3} maxLength={500} value={storyExtraGuidance} onChange={(e) => setStoryExtraGuidance(e.target.value)} placeholder="AI'ya özel bir yönlendirme eklemek isterseniz..." className="w-full p-3 rounded-xl border border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100 text-xs bg-white" />
              </div>
            </div>
          )}

          {/* Mode: Text */}
          {mode === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Talep Açıklaması *</label>
                <textarea rows={4} maxLength={MAX_TEXT_LENGTH} value={textDescription} onChange={(e) => setTextDescription(e.target.value)} placeholder="İhtiyacı, mevcut durumu ve hedeflenen değişikliği detaylıca açıklayın..." className="w-full p-3 rounded-xl border border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100 text-sm bg-white" />
                <div className="text-right text-[10px] text-slate-400 mt-0.5">{textDescription.length}/{MAX_TEXT_LENGTH}</div>
              </div>

              {/* AI Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Görsel / Mockup (AI Analizi İçin)
                </label>
                {imageFile ? (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <img src={imageFile.previewUrl} alt={imageFile.name} className="w-12 h-12 rounded-lg object-cover border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{imageFile.name}</p>
                      <p className="text-[10px] text-slate-400">{imageFile.sizeMb} MB</p>
                    </div>
                    <button type="button" onClick={removeAiImage} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-jira-500 bg-white p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all">
                    <UploadCloud className="w-5 h-5 text-jira-600" />
                    <span className="text-xs text-slate-600">Görsel seçin (PNG, JPG, WEBP)</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button type="button" onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm jira-gradient-bg shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Gemini AI Formu Dolduruyor...' : 'IPK Demand Formunu AI ile Oluştur'}</span>
          </button>
        </div>
      )}

      {/* STEP 2: Schema-Driven Form Preview & Edit */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI tarafından doldurulan IPK Demand formu aşağıdadır. Düzenleyip Jira'ya gönderebilirsiniz.</span>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-jira-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Form Renderer — reads from schema */}
          <DynamicFormRenderer
            schema={IPK_FORM_SCHEMA}
            formData={ipkForm}
            onChange={handleFieldChange}
            activeSection={activeTab}
          />

          {/* Demand Attachments — Scoped strictly to 'genel' section tab */}
          {activeTab === 'genel' && (
            <div className="pt-2 border-t border-slate-200">
              <FileUploadZone
                images={[]}
                files={fileUpload.files}
                onImageUpload={() => {}}
                onFileUpload={fileUpload.handleFileUpload}
                onRemoveImage={() => {}}
                onRemoveFile={fileUpload.removeFile}
                showFiles={true}
                imageLabel=""
                fileLabel="Jira IPK Demand Eklerine Dosya Ekle"
                fileAccept=".pdf,.txt,.doc,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
              />
            </div>
          )}
        </div>
      )}
    </DrawerShell>
  );
}
