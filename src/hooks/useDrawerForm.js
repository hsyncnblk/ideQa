/**
 * @module hooks/useDrawerForm
 *
 * Reusable hook for common drawer lifecycle:
 * step management, generating/submitting states, error handling, and auto-reset on close.
 * Eliminates repeated state declarations across StoryDrawer, BugDrawer, IpkDrawer.
 *
 * @param {object} options
 * @param {boolean} options.isOpen - Whether the drawer is currently open
 * @param {Function} [options.onResetCallback] - Additional cleanup to run on reset
 */

import { useState, useEffect, useCallback } from 'react';

export function useDrawerForm({ isOpen, onResetCallback } = {}) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Resets all drawer state back to initial.
   * Calls optional onResetCallback for feature-specific cleanup.
   */
  const resetForm = useCallback(() => {
    setStep(1);
    setIsGenerating(false);
    setIsSubmitting(false);
    setError(null);
    if (onResetCallback) onResetCallback();
  }, [onResetCallback]);

  // Auto-reset when drawer closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  /**
   * Wraps an async operation with generating state management and error handling.
   * @param {Function} asyncFn - The async function to execute
   * @param {object} [options]
   * @param {boolean} [options.advanceStep=true] - Whether to advance step on success
   */
  const withGenerating = useCallback(async (asyncFn, { advanceStep = true } = {}) => {
    setError(null);
    setIsGenerating(true);
    try {
      const result = await asyncFn();
      if (advanceStep) setStep((prev) => prev + 1);
      return result;
    } catch (err) {
      setError(err.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Wraps an async operation with submitting state management and error handling.
   * @param {Function} asyncFn - The async function to execute
   */
  const withSubmitting = useCallback(async (asyncFn) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err.message || 'Gönderim sırasında bir hata oluştu.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    step,
    setStep,
    isGenerating,
    isSubmitting,
    error,
    setError,
    resetForm,
    withGenerating,
    withSubmitting,
  };
}
