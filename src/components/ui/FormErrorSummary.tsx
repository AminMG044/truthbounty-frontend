'use client';

import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormErrorSummaryItem {
  id: string;
  fieldId?: string;
  category?: 'authorization' | 'server' | 'simulation' | 'validation' | string;
  message: string;
}

export interface FormErrorSummaryProps {
  errors: FormErrorSummaryItem[];
  title?: string;
  onNavigateToField?: (fieldId: string) => void;
  className?: string;
}

export const FormErrorSummary = forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  function FormErrorSummary(
    { errors, title = 'There was a problem submitting your request', onNavigateToField, className = '' },
    ref,
  ) {
    if (errors.length === 0) return null;

    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="alert"
        aria-labelledby="form-error-summary-title"
        className={`p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive space-y-2 focus:outline-none focus:ring-2 focus:ring-destructive/50 ${className}`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h2 id="form-error-summary-title" className="text-sm font-semibold text-destructive">
            {title}
          </h2>
        </div>
        <ul className="space-y-1 list-disc list-inside text-xs pl-2">
          {errors.map((error) => (
            <li key={error.id} className="text-destructive/90">
              {error.fieldId && onNavigateToField ? (
                <button
                  type="button"
                  onClick={() => onNavigateToField(error.fieldId!)}
                  className="underline hover:text-destructive cursor-pointer font-medium text-left"
                >
                  {error.message}
                </button>
              ) : (
                <span>{error.message}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

export default FormErrorSummary;
