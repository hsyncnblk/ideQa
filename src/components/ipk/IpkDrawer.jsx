import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Sparkles,
  Search,
  Type,
  User,
  Tag,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  DollarSign,
  Send,
  Layers,
  UploadCloud,
  ImageIcon,
  Trash2,
  Paperclip,
  Plus,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import { jiraService } from '../../services/jiraService';

const MAX_TEXT_LENGTH = 2000;
const MAX_FILE_SIZE_MB = 5;

export default function IpkDrawer({ isOpen, onClose, selectedTeam = 'Team Alpha', onIpkCreated }) {
  const [mode, setMode] = useState('story'); // 'story' or 'text'
  const [storyKey, setStoryKey] = useState('SCRUM-5');
  const [storyExtraGuidance, setStoryExtraGuidance] = useState('');
  const [textDescription, setTextDescription] = useState('');
  const [imageFile, setImageFile] = useState(null); // { name, sizeMb, mimeType, base64, previewUrl }
  
  // Attachments to send to Jira (Excel, Photos, PDFs, Docs) for both options in Step 2
  const [demandAttachments, setDemandAttachments] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Step: 1 = Input selection, 2 = Form Preview & Edit
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('genel'); // 'genel', 'etki_kapsami', 'finansal_etki'

  // IPK Form Data State
  const [ipkForm, setIpkForm] = useState({
    assignee: 'hsyn deneme',
    labels: ['otomasyon_ai'],
    genel: {
      summary: '',
      business_goal: '',
      business_goal_detail: '',
      as_is: '',
      impacted_stakeholders: '',
      platform: 'Tüm Platformlar',
      product_area: '',
      stakeholder_touchpoint: '',
      stakeholder_touchpoint_other: '',
      how_stakeholders_affected: '',
      demand_category: '',
      to_be: '',
      demand_trigger: '',
      acceptance_criteria: '',
      urgency_timing: '',
      dependent_internal_systems: '',
      dependent_external_systems: '',
      el_comment: '',
      expected_output_value: '',
      confidence: 'High',
      demand_size: 'L',
      show_on_timeline: 'Evet'
    },
    etki_kapsami: {
      scope_channel: '',
      scope_segment: '',
      scope_category: '',
      scope_location: '',
      scope_seller_group: ''
    },
    finansal_etki: {
      financial_aov: '',
      financial_cr: '',
      financial_revenue: '',
      financial_orders: '',
      financial_traffic: ''
    }
  });

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setError(`Görsel boyutu maksimum ${MAX_FILE_SIZE_MB} MB olabilir. Seçilen görsel: ${sizeMb.toFixed(2)} MB`);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result;
      const base64Data = resultStr.split(',')[1];
      setImageFile({
        name: file.name,
        sizeMb: sizeMb.toFixed(2),
        mimeType: file.type || 'image/png',
        base64: base64Data,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (imageFile?.previewUrl) {
      URL.revokeObjectURL(imageFile.previewUrl);
    }
    setImageFile(null);
  };

  const handleDemandAttachmentAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = [...demandAttachments];
    for (const file of files) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      if (parseFloat(sizeMb) > 15) {
        setError(`Ek dosya boyutu 15 MB'ı aşamaz. (${file.name})`);
        continue;
      }
      newAttachments.push({
        name: file.name,
        sizeMb,
        fileObject: file
      });
    }
    setDemandAttachments(newAttachments);
  };

  const removeDemandAttachment = (index) => {
    setDemandAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleGenerate = async () => {
    setError(null);
    if (mode === 'story' && !storyKey.trim()) {
      setError('Lütfen geçerli bir Story No girin (örn: SCRUM-5).');
      return;
    }
    if (mode === 'text' && !textDescription.trim() && !imageFile) {
      setError('Lütfen talep açıklamasını veya bir görsel yükleyin.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await geminiService.generateIpkDemand({
        mode,
        storyKey: mode === 'story' ? storyKey.trim() : '',
        extraGuidance: mode === 'story' ? storyExtraGuidance.trim() : '',
        textDescription: mode === 'text' ? textDescription.trim() : '',
        imageFile: mode === 'text' ? imageFile : null,
        teamName: selectedTeam
      });

      if (result && result.data) {
        setIpkForm({
          assignee: 'hsyn deneme',
          labels: ['otomasyon_ai'],
          genel: { ...ipkForm.genel, ...(result.data.genel || {}) },
          etki_kapsami: { ...ipkForm.etki_kapsami, ...(result.data.etki_kapsami || {}) },
          finansal_etki: { ...ipkForm.finansal_etki, ...(result.data.finansal_etki || {}) }
        });
        setStep(2);
      }
    } catch (err) {
      console.error('IPK Üretim Hatası:', err);
      setError(err.message || 'IPK formu doldurulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFieldChange = (section, field, value) => {
    setIpkForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmitToJira = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await jiraService.createIpkDemand({
        ipkData: ipkForm,
        storyKey: mode === 'story' ? storyKey.trim() : null,
        attachments: demandAttachments
      });

      if (onIpkCreated) {
        onIpkCreated(result);
      }
      onClose();
    } catch (err) {
      console.error('Jira IPK oluşturma hatası:', err);
      setError(err.message || 'Jira kaydı oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jira-600 flex items-center justify-center text-amber-300 shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                İPK (İdefix Portfolio Kanban) Demand Asistanı
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  otomasyon_ai
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                AI destekli otomatik Talep (Demand) formu oluşturma ve Jira entegrasyonu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1.5 max-w-md mx-auto border border-slate-200">
            <button
              onClick={() => setMode('story')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'story'
                  ? 'bg-white text-jira-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Seçenek 1: Story No ile
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'text'
                  ? 'bg-white text-jira-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Seçenek 2: Metin ile
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Input Section */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
              {mode === 'story' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Jira Story Numarası *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={storyKey}
                        onChange={(e) => setStoryKey(e.target.value)}
                        placeholder="Örn: SCRUM-5, MP-123"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100 font-mono text-sm font-semibold uppercase"
                      />
                      <div className="absolute right-3 top-3 text-xs text-slate-400 font-medium">
                        Jira Entegre
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Seçilen Story'nin başlık, kabul kriterleri ve açıklaması incelenerek IPK Demand formu otomatik doldurulacaktır.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Yapay Zekaya Ek Not / Özel Yönlendirme (İsteğe Bağlı)</span>
                      <span className="text-[10px] text-slate-400 font-normal">İsteğe Bağlı</span>
                    </label>
                    <textarea
                      rows={3}
                      value={storyExtraGuidance}
                      onChange={(e) => setStoryExtraGuidance(e.target.value)}
                      placeholder="Örn: Bu Story için CraftGate ödeme entegrasyonuna, satıcı komisyon dağılımlarına ve mobil platform etkilerine özel vurgu yapılsın..."
                      className="w-full p-3 rounded-xl border border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Talep Açıklaması / Detaylı Metin
                      </label>
                      <span className={`text-[11px] font-mono font-semibold ${
                        textDescription.length >= MAX_TEXT_LENGTH ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {textDescription.length} / {MAX_TEXT_LENGTH} karakter
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={MAX_TEXT_LENGTH}
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      placeholder="E-ticaret pazaryeri, kargo barajı, ödeme entegrasyonu veya yeni özellik talebinizi detaylıca buraya yazın..."
                      className="w-full p-4 rounded-xl border border-slate-300 focus:border-jira-500 focus:ring-2 focus:ring-jira-100 text-sm leading-relaxed"
                    />
                  </div>

                  {/* Image Attachment Component (Max 5 MB) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Ek Görsel / Tasarım / Akış Şeması Yükle (İsteğe Bağlı)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Maks. {MAX_FILE_SIZE_MB} MB</span>
                    </label>

                    {!imageFile ? (
                      <label className="border-2 border-dashed border-slate-300 hover:border-jira-500 bg-white hover:bg-jira-50/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                        <UploadCloud className="w-6 h-6 text-jira-600" />
                        <span className="text-xs font-semibold text-slate-700">
                          Görsel yüklemek için tıklayın veya sürükleyin
                        </span>
                        <span className="text-[11px] text-slate-400">
                          PNG, JPG, WEBP (Maksimum {MAX_FILE_SIZE_MB} MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageFile.previewUrl}
                            alt="Yüklenen Görsel Önizlemesi"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-jira-600" />
                              <span className="truncate max-w-[200px]">{imageFile.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Boyut: <strong className="text-slate-600">{imageFile.sizeMb} MB</strong> (Gemini AI Analizine Dahil)
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={removeImage}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Görseli Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assignee & Label Badges (Option 2 hides Assignee) */}
              <div className={`grid gap-3 pt-2 ${mode === 'story' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {mode === 'story' && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-jira-600" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Atanan Kişi (Assignee)</div>
                      <div className="text-xs font-bold text-slate-800">hsyn deneme</div>
                    </div>
                  </div>
                )}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Zorunlu Etiket (Label)</div>
                    <div className="text-xs font-mono font-bold text-emerald-700">otomasyon_ai</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-xl jira-gradient-bg text-white font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI IPK Şeması Oluşturuyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Gemini AI ile IPK Formu Oluştur</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Form Preview & Interactive Tabs */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Metadata Bar */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>IPK Formu Gemini AI Tarafından Başarıyla Hazırlandı</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  {mode === 'story' && (
                    <span>Atanan: <strong className="text-slate-900">hsyn deneme</strong></span>
                  )}
                  <span>Etiket: <strong className="font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">otomasyon_ai</strong></span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('genel')}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'genel'
                        ? 'border-jira-600 text-jira-700 bg-jira-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    1. Genel Bilgiler
                  </button>
                  <button
                    onClick={() => setActiveTab('etki_kapsami')}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'etki_kapsami'
                        ? 'border-jira-600 text-jira-700 bg-jira-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    2. Etki Kapsamı
                  </button>
                  <button
                    onClick={() => setActiveTab('finansal_etki')}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'finansal_etki'
                        ? 'border-jira-600 text-jira-700 bg-jira-50/50 rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    3. Finansal Etki
                  </button>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-jira-600 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ← Yeniden Analiz Et
                </button>
              </div>

              {/* TAB 1: Genel Bilgiler */}
              {activeTab === 'genel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Özet (Summary) *
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.summary}
                      onChange={(e) => handleFieldChange('genel', 'summary', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:border-jira-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bu talep hangi iş hedefini destekliyor?
                    </label>
                    <textarea
                      rows={2}
                      value={ipkForm.genel.business_goal}
                      onChange={(e) => handleFieldChange('genel', 'business_goal', e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      İş Hedefi Detayı (Diğer Açıklama)
                    </label>
                    <textarea
                      rows={2}
                      value={ipkForm.genel.business_goal_detail}
                      onChange={(e) => handleFieldChange('genel', 'business_goal_detail', e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Mevcut Süreç (As-Is Kısa Özet)
                    </label>
                    <textarea
                      rows={2.5}
                      value={ipkForm.genel.as_is}
                      onChange={(e) => handleFieldChange('genel', 'as_is', e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Talep Sonrası Süreç (To-Be Kısa Özet)
                    </label>
                    <textarea
                      rows={2.5}
                      value={ipkForm.genel.to_be}
                      onChange={(e) => handleFieldChange('genel', 'to_be', e.target.value)}
                      className="w-full p-2.5 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Kabul Kriterleri (Acceptance Criteria - En az 3 madde)
                    </label>
                    <textarea
                      rows={4}
                      value={ipkForm.genel.acceptance_criteria}
                      onChange={(e) => handleFieldChange('genel', 'acceptance_criteria', e.target.value)}
                      className="w-full p-3 bg-white rounded-lg border border-slate-300 text-xs font-mono leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etkilenen Paydaşlar
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.impacted_stakeholders}
                      onChange={(e) => handleFieldChange('genel', 'impacted_stakeholders', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Hangi Platform?
                    </label>
                    <select
                      value={ipkForm.genel.platform}
                      onChange={(e) => handleFieldChange('genel', 'platform', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium"
                    >
                      <option value="Tüm Platformlar">Tüm Platformlar</option>
                      <option value="Web">Web</option>
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Hangi Ürün Alanı Etkileniyor?
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.product_area}
                      onChange={(e) => handleFieldChange('genel', 'product_area', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Talep Kategorisi
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.demand_category}
                      onChange={(e) => handleFieldChange('genel', 'demand_category', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bağımlı İç Sistemler
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.dependent_internal_systems}
                      onChange={(e) => handleFieldChange('genel', 'dependent_internal_systems', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bağımlı Dış Sistemler (Örn: CraftGate)
                    </label>
                    <input
                      type="text"
                      value={ipkForm.genel.dependent_external_systems}
                      onChange={(e) => handleFieldChange('genel', 'dependent_external_systems', e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Confidence
                      </label>
                      <select
                        value={ipkForm.genel.confidence}
                        onChange={(e) => handleFieldChange('genel', 'confidence', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Demand Size
                      </label>
                      <select
                        value={ipkForm.genel.demand_size}
                        onChange={(e) => handleFieldChange('genel', 'demand_size', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Timeline'da Göster
                      </label>
                      <select
                        value={ipkForm.genel.show_on_timeline}
                        onChange={(e) => handleFieldChange('genel', 'show_on_timeline', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold"
                      >
                        <option value="Evet">Evet</option>
                        <option value="Hayır">Hayır</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Etki Kapsamı */}
              {activeTab === 'etki_kapsami' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etki Kapsamı Belirli Kanal
                    </label>
                    <input
                      type="text"
                      value={ipkForm.etki_kapsami.scope_channel}
                      onChange={(e) => handleFieldChange('etki_kapsami', 'scope_channel', e.target.value)}
                      placeholder="Web, Mobil Web, iOS, Android"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etki Kapsamı Belirli Segment
                    </label>
                    <input
                      type="text"
                      value={ipkForm.etki_kapsami.scope_segment}
                      onChange={(e) => handleFieldChange('etki_kapsami', 'scope_segment', e.target.value)}
                      placeholder="Tüm B2C Müşteriler, VIP vb."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etki Kapsamı Belirli Kategori
                    </label>
                    <input
                      type="text"
                      value={ipkForm.etki_kapsami.scope_category}
                      onChange={(e) => handleFieldChange('etki_kapsami', 'scope_category', e.target.value)}
                      placeholder="Moda, Elektronik, Kitap vb."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etki Kapsamı Belirli Ülke / Şehir
                    </label>
                    <input
                      type="text"
                      value={ipkForm.etki_kapsami.scope_location}
                      onChange={(e) => handleFieldChange('etki_kapsami', 'scope_location', e.target.value)}
                      placeholder="Türkiye (Tüm İller)"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Etki Kapsamı Belirli Satıcı Grubu
                    </label>
                    <input
                      type="text"
                      value={ipkForm.etki_kapsami.scope_seller_group}
                      onChange={(e) => handleFieldChange('etki_kapsami', 'scope_seller_group', e.target.value)}
                      placeholder="Tüm Aktif Pazaryeri Satıcıları"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Finansal Etki */}
              {activeTab === 'finansal_etki' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Finansal Etki Tahmini AOV
                    </label>
                    <input
                      type="text"
                      value={ipkForm.finansal_etki.financial_aov}
                      onChange={(e) => handleFieldChange('finansal_etki', 'financial_aov', e.target.value)}
                      placeholder="AOV üzerinde yaklaşık %8 artış"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Finansal Etki Tahmini CR (Dönüşüm Oranı)
                    </label>
                    <input
                      type="text"
                      value={ipkForm.finansal_etki.financial_cr}
                      onChange={(e) => handleFieldChange('finansal_etki', 'financial_cr', e.target.value)}
                      placeholder="+%1.5 iyileşme"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Finansal Etki Tahmini Gelir Etkisi
                    </label>
                    <input
                      type="text"
                      value={ipkForm.finansal_etki.financial_revenue}
                      onChange={(e) => handleFieldChange('finansal_etki', 'financial_revenue', e.target.value)}
                      placeholder="Aylık ortalama +450.000 TL"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Finansal Etki Tahmini Sipariş
                    </label>
                    <input
                      type="text"
                      value={ipkForm.finansal_etki.financial_orders}
                      onChange={(e) => handleFieldChange('finansal_etki', 'financial_orders', e.target.value)}
                      placeholder="Aylık sipariş hacminde %4 büyüme"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Finansal Etki Tahmini Trafik
                    </label>
                    <input
                      type="text"
                      value={ipkForm.finansal_etki.financial_traffic}
                      onChange={(e) => handleFieldChange('finansal_etki', 'financial_traffic', e.target.value)}
                      placeholder="Sepet dönüşüm odaklı"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Jira Attachment Section (Supported for both Option 1 and Option 2) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-jira-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Jira Biletine Ek Dosya / Doküman Ekle (Fotoğraf, Excel, PDF vb.)
                    </span>
                    {demandAttachments.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-jira-100 text-jira-700">
                        {demandAttachments.length} Dosya
                      </span>
                    )}
                  </div>

                  <label className="py-1.5 px-3 bg-white border border-slate-300 hover:border-jira-500 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-jira-50/40 transition-all">
                    <Plus className="w-3.5 h-3.5 text-jira-600" />
                    <span>Dosya Ekle</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.xlsx,.xls,.csv,.pdf,.doc,.docx,.txt"
                      onChange={handleDemandAttachmentAdd}
                      className="hidden"
                    />
                  </label>
                </div>

                {demandAttachments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Bilete eklemek istediğiniz fotoğraf, mock-up, Excel tablosu veya PDF dokümanlarını buraya yükleyebilirsiniz.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {demandAttachments.map((file, idx) => {
                      const isExcel = file.name.match(/\.(xlsx|xls|csv)$/i);
                      const isImage = file.name.match(/\.(png|jpg|jpeg|webp|gif)$/i);
                      return (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                              isExcel ? 'bg-emerald-100 text-emerald-700' :
                              isImage ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {isExcel ? <FileSpreadsheet className="w-4 h-4" /> :
                               isImage ? <ImageIcon className="w-4 h-4" /> :
                               <FileText className="w-4 h-4" />}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {file.sizeMb} MB
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeDemandAttachment(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Dosyayı Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {mode === 'story' && (
              <>
                <User className="w-3.5 h-3.5 text-jira-600" />
                <span>Assignee: <strong>hsyn deneme</strong></span>
                <span className="mx-1">•</span>
              </>
            )}
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Label: <strong className="font-mono text-emerald-700">otomasyon_ai</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>

            {step === 2 && (
              <button
                onClick={handleSubmitToJira}
                disabled={isSubmitting}
                className="py-2.5 px-5 rounded-xl jira-gradient-bg text-white text-xs font-bold shadow-md hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Jira'da Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Jira'da Demand Oluştur</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
