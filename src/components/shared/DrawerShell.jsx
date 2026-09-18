/**
 * @module components/shared/DrawerShell
 *
 * Reusable drawer wrapper component.
 * Provides: backdrop, slide-in panel, header (title + icon + actions), scrollable body, footer bar.
 * Eliminates ~50 lines of repeated JSX structure in every drawer component.
 */

import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} props.icon - Pre-rendered icon element
 * @param {Function} [props.onReset] - Optional reset handler (shows "Yeniden Başla" button)
 * @param {boolean} [props.showReset=false]
 * @param {React.ReactNode} [props.footer] - Footer content (buttons, etc.)
 * @param {string} [props.maxWidth='max-w-3xl'] - Drawer panel max width
 * @param {React.ReactNode} props.children - Drawer body content
 */
export default function DrawerShell({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  onReset,
  showReset = false,
  footer,
  maxWidth = 'max-w-3xl',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className={`w-screen ${maxWidth} bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slide-in-right`}>

          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {icon}
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-slate-500">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {showReset && onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Yeni Girdi Yap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yeniden Başla</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2.5">
              {footer}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
