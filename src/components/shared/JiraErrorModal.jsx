import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { extractJiraErrorMessages } from '../../core/ErrorHandler';
import { envConfig } from '../../config/envConfig';

/**
 * Jira Error Popup Modal
 * Displays Jira API rejection errors (workflow validators, permission issues, status constraints)
 * in a prominent, readable modal dialog.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {object|Error|string} props.error - Error object or error payload
 * @param {string} [props.title] - Optional title override
 * @param {string} [props.storyKey] - Related Jira story key (if any)
 */
export default function JiraErrorModal({
  isOpen,
  onClose,
  error,
  title = 'Jira İşlem Onayı Alınamadı',
  storyKey = null,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !error) return null;

  // Hata detaylarını ayrıştır
  let rawBody = '';
  let mainMessage = '';
  let errorList = [];
  let resolvedStoryKey = storyKey;

  if (typeof error === 'string') {
    mainMessage = error;
    errorList = extractJiraErrorMessages(error);
  } else if (error instanceof Error) {
    mainMessage = error.message;
    rawBody = error.responseBody || error.meta?.responseBody || '';
    errorList = error.errorList || extractJiraErrorMessages(rawBody);
    resolvedStoryKey = resolvedStoryKey || error.storyKey || error.meta?.storyKey;
  } else if (typeof error === 'object') {
    mainMessage = error.message || error.title || 'Jira üzerinde işlem gerçekleştirilemedi.';
    rawBody = error.responseBody || error.raw || '';
    errorList = error.errorList || error.errorMessages || extractJiraErrorMessages(rawBody);
    resolvedStoryKey = resolvedStoryKey || error.storyKey;
  }

  if (errorList.length === 0 && mainMessage) {
    errorList = [mainMessage];
  }

  // Workflow / durum kısıtlaması tespiti
  const isWorkflowStatusError = errorList.some((msg) =>
    /durum|workflow|onaylanmad[ıi]|yapılacaklar|devam ediyor|backlog/i.test(msg)
  );

  const handleCopy = () => {
    const textToCopy = errorList.join('\n') || mainMessage;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const storyBrowseUrl = resolvedStoryKey
    ? `${envConfig.jira.baseUrl}/browse/${resolvedStoryKey}`
    : null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-lg w-full overflow-hidden relative animate-scale-up">
        {/* Üst Kırmızı/Turuncu Vurgu Çizgisi */}
        <div className="h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500" />

        {/* Modal Başlık Çubuğu */}
        <div className="p-5 sm:p-6 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                  Jira Kural Uyarısı
                </span>
                {resolvedStoryKey && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {resolvedStoryKey}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal İçerik Gövdesi */}
        <div className="p-5 sm:p-6 pt-2 space-y-4">
          {/* Ana Hata Kutusu */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                  Jira Tarafından Dönen Hata Mesajı:
                </p>
                <div className="space-y-1.5">
                  {errorList.map((msg, idx) => (
                    <div
                      key={idx}
                      className="text-xs sm:text-sm font-semibold text-slate-800 bg-white/80 p-2.5 rounded-lg border border-rose-200/60 leading-relaxed break-words"
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Durum İpucu (Kullanıcının karşılaştığı hata tipi için özel rehber) */}
          {isWorkflowStatusError && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Neden Bu Hata Oluştu?</span>
              </div>
              <p className="leading-relaxed pl-5 text-[11px] text-amber-900">
                Jira iş akışı (workflow) kuralları gereği, alt görev (Subtask) açabilmek için ana Story'nin belirtilen durumlardan birinde (örn: <em>Devam Ediyor, Yapılacaklar, Backlog</em>) bulunması zorunludur. Lütfen ana Story'nin durumunu kontrol ediniz.
              </p>
            </div>
          )}

          {/* Alt Butonlar */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Hatayı Kopyala</span>
                </>
              )}
            </button>

            {storyBrowseUrl && (
              <a
                href={storyBrowseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Jira'da Story'i Aç</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

