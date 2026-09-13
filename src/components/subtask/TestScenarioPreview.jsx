import React, { useState } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Tag,
  Users,
  FileCode,
  Info,
  CheckCircle2,
  ShieldAlert,
  Terminal
} from 'lucide-react';

export default function TestScenarioPreview({ scenario, selectedTeam }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scenario.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Sabit Bilgi Notu & Rozetler (Önemli Kullanıcı İsteği) */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Jira Entegrasyon Bilgisi:</span> Bu test paketi Jira'ya aktarılırken{' '}
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
              <Tag className="w-3 h-3" /> otomasyon_ai
            </span>{' '}
            etiketi ve{' '}
            <span className="inline-flex items-center gap-1 font-bold text-jira-800 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-300">
              <Users className="w-3 h-3" /> MPTeam: {selectedTeam}
            </span>{' '}
            alanı otomatik olarak tanımlanacaktır.
          </div>
        </div>
      </div>

      {/* Test Senaryosu Kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Kart Başlığı ve Hızlı Aksiyonlar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Gemini Markdown Çıktısı
            </span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Story: {scenario.storyKey}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Metni Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Markdown Okuma Alanı */}
        <div className="p-4 sm:p-5 max-h-[380px] overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800 bg-slate-50/40">

          {/* Subtask Başlık Kartı */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Oluşturulacak Subtask Özeti:
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {scenario.subtaskSummary}
            </p>
          </div>

          {/* Test Adımları Önizleme */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">

            <div>
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 text-jira-700">
                <FileCode className="w-4 h-4" />
                1. Ön Koşullar (Pre-conditions)
              </h5>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                <li>Test ortamı (Staging/QA) aktif ve <strong>{selectedTeam}</strong> mikroservisleri ayakta olmalı.</li>
                <li>Veritabanında test için geçerli aktif bir kullanıcı profili hazır bulunmalı.</li>
                <li>Mock servis API yanıtları ve 3rd-party ağ geçitleri erişilebilir olmalı.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                2. Pozitif Test Senaryoları (Happy Path)
              </h5>
              <div className="mt-2 space-y-2 text-xs text-slate-700">
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="font-bold text-emerald-900 block">TC-01: Başarılı Standart Akış Doğrulaması</span>
                  <span className="text-slate-600 block mt-1">
                    <strong>Given:</strong> Kullanıcı geçerli girdilerle istek başlattığında,<br />
                    <strong>When:</strong> İşlem onaylandığında,<br />
                    <strong>Then:</strong> HTTP 200 dönmeli ve UI üzerinde başarı bildirimi gösterilmelidir.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 text-amber-700">
                <ShieldAlert className="w-4 h-4" />
                3. Negatif & Sınır (Edge Case) Testleri
              </h5>
              <div className="mt-2 space-y-2 text-xs text-slate-700">
                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span className="font-bold text-amber-900 block">TC-03: Hatalı / Boş Parametre Validasyonu</span>
                  <span className="text-slate-600 block mt-1">
                    <strong>When:</strong> Eksik parametre gönderildiğinde HTTP 400 Bad Request dönmeli ve formda ilgili alanlar işaretlenmelidir.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 text-indigo-700">
                <Terminal className="w-4 h-4" />
                4. Otomasyon Etiketleri & Metadata
              </h5>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium">Tür: Sub-task</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold">Etiket: otomasyon_ai</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">MPTeam: {selectedTeam}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded font-semibold">Efor: 2 SP</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
