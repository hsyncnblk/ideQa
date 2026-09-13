import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function EditableScenarioCard({
  type = 'positive', // 'positive' | 'negative'
  title,
  content,
  isSelected,
  onToggleSelect,
  onContentChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const isPositive = type === 'positive';

  return (
    <div className={`rounded-xl border transition-all ${
      isSelected 
        ? isPositive 
          ? 'bg-white border-emerald-300 shadow-2xs' 
          : 'bg-white border-amber-300 shadow-2xs'
        : 'bg-slate-50/70 border-slate-200 opacity-75'
    }`}>
      
      {/* Kart Üst Barı */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isPositive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
      }`}>
        
        {/* Sol Taraf: Checkbox ve Başlık */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-jira-600 rounded border-slate-300 focus:ring-jira-200 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {title}
            </span>
          </div>
        </label>

        {/* Sağ Taraf: Düzenle / Önizle ve Kopyala Butonları */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
            title={isEditing ? 'Önizlemeye Dön' : 'Metni Düzenle'}
          >
            {isEditing ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Önizle</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3 text-jira-600" />
                <span>Düzenle</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-white/80 transition-colors cursor-pointer"
            title="Panoya Kopyala"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* İçerik Alanı: Düzenlenebilir Editör veya Önizleme */}
      <div className="p-3.5">
        {isEditing ? (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Markdown İçeriği Düzenleyin (Değişiklikler anlık kaydedilir):
            </span>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 rounded-lg border border-slate-300 focus:border-jira-500 focus:ring-jira-100 focus:outline-none focus:ring-2 transition-all resize-y"
            />
          </div>
        ) : (
          <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-slate-50/50 p-3 rounded-lg border border-slate-100">
            {content}
          </div>
        )}
      </div>

    </div>
  );
}
