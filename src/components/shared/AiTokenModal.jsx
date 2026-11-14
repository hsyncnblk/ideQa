import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Check, Bot } from 'lucide-react';
import { getAiConfig, saveAiConfig, AI_PROVIDERS } from '../../core/aiConfig';

export default function AiTokenModal({ isOpen, onClose, onSaved }) {
  const [provider, setProvider] = useState('gemini');
  const [geminiToken, setGeminiToken] = useState('');
  const [claudeToken, setClaudeToken] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getAiConfig();
      setProvider(cfg.provider || 'gemini');
      setGeminiToken(cfg.geminiToken || '');
      setClaudeToken(cfg.claudeToken || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentToken = provider === 'claude' ? claudeToken : geminiToken;
  const setCurrentToken = (val) => {
    if (provider === 'claude') setClaudeToken(val);
    else setGeminiToken(val);
  };

  const currentProviderObj = AI_PROVIDERS.find(p => p.id === provider) || AI_PROVIDERS[0];

  const handleSave = (e) => {
    e.preventDefault();
    saveAiConfig({
      provider,
      token: currentToken,
    });
    setSavedSuccess(true);
    if (onSaved) onSaved({ provider, token: currentToken });
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Yapay Zeka Modeli & API Token</h3>
            <p className="text-xs text-slate-500">Test senaryosu üretimi için AI sağlayıcınızı seçin</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Model Sağlayıcısı
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {AI_PROVIDERS.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{p.defaultModel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {currentProviderObj.name} API Anahtarı (Token)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={currentToken}
                onChange={(e) => setCurrentToken(e.target.value)}
                placeholder={currentProviderObj.placeholder}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-purple-600 focus:ring-purple-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Token'ınız yalnızca tarayıcınızda (localStorage) saklanır, çıkış yapsanız dahi silinmez.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kaydedildi</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

