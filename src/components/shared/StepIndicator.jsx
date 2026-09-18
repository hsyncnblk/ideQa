/**
 * @module components/shared/StepIndicator
 *
 * Visual step progress indicator for multi-step drawer workflows.
 * Provides consistent step display across all drawer components.
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * @param {object} props
 * @param {Array<{ label: string, description?: string }>} props.steps - Step definitions
 * @param {number} props.currentStep - Current step (1-indexed)
 */
export default function StepIndicator({ steps = [], currentStep = 1 }) {
  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <React.Fragment key={idx}>
            {/* Step Circle + Label */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-jira-600 text-white shadow-sm shadow-jira-600/25'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent ? 'text-slate-800' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-1 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
