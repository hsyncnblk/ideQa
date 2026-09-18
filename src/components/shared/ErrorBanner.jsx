/**
 * @module components/shared/ErrorBanner
 *
 * Standardized error display component.
 * Used across all drawers for consistent error messaging.
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * @param {object} props
 * @param {string|null} props.error - Error message to display
 * @param {Function} [props.onDismiss] - Optional dismiss handler
 * @param {Function} [props.onRetry] - Optional retry handler
 * @param {string} [props.retryLabel='Tekrar Dene'] - Retry button label
 */
export default function ErrorBanner({ error, onDismiss, onRetry, retryLabel = 'Tekrar Dene' }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <p className="break-words">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
          >
            {retryLabel}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 text-red-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
