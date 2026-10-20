'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PREDEFINED_CATEGORIES,
  TITLE_MAX_LENGTH,
  validateTitle,
} from '@/lib/claim-submission/validation';
import { useRecoverableFormDraft } from '@/hooks/useRecoverableFormDraft';
import type { RecoverableDraftStatus } from '@/hooks/useRecoverableFormDraft';
import type { DraftQuarantineReason, DraftScope } from '@/lib/drafts/recoverable-draft';

export interface ClaimStatementDraft {
  title: string;
  category: string;
  geographicScope: string;
  verificationContext: string;
}

export const EMPTY_CLAIM_STATEMENT: ClaimStatementDraft = {
  title: '',
  category: '',
  geographicScope: '',
  verificationContext: '',
};

const FORM_ID = 'claim-statement';
const MAX_GEOGRAPHIC_SCOPE_LENGTH = 160;
const MAX_VERIFICATION_CONTEXT_LENGTH = 2000;

type StatementField = keyof ClaimStatementDraft;
type StatementErrors = Partial<Record<StatementField, string>>;

function isClaimStatementDraft(value: unknown): value is ClaimStatementDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expectedKeys = Object.keys(EMPTY_CLAIM_STATEMENT).sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index]) &&
    typeof record.title === 'string' && record.title.length <= TITLE_MAX_LENGTH &&
    typeof record.category === 'string' &&
    (record.category === '' || PREDEFINED_CATEGORIES.includes(record.category as typeof PREDEFINED_CATEGORIES[number])) &&
    typeof record.geographicScope === 'string' && record.geographicScope.length <= MAX_GEOGRAPHIC_SCOPE_LENGTH &&
    typeof record.verificationContext === 'string' && record.verificationContext.length <= MAX_VERIFICATION_CONTEXT_LENGTH
  );
}

export function validateClaimStatement(data: ClaimStatementDraft): StatementErrors {
  const errors: StatementErrors = {};
  const title = validateTitle(data.title);
  if (!title.valid) errors.title = title.error;
  if (!PREDEFINED_CATEGORIES.includes(data.category as typeof PREDEFINED_CATEGORIES[number])) {
    errors.category = 'Choose a category.';
  }
  if (!data.geographicScope.trim()) errors.geographicScope = 'Geographic scope is required.';
  else if (data.geographicScope.length > MAX_GEOGRAPHIC_SCOPE_LENGTH) {
    errors.geographicScope = `Use ${MAX_GEOGRAPHIC_SCOPE_LENGTH} characters or fewer.`;
  }
  if (data.verificationContext.trim().length < 10) {
    errors.verificationContext = 'Enter at least 10 characters of verification context.';
  } else if (data.verificationContext.length > MAX_VERIFICATION_CONTEXT_LENGTH) {
    errors.verificationContext = `Use ${MAX_VERIFICATION_CONTEXT_LENGTH} characters or fewer.`;
  }
  return errors;
}

export interface ClaimStatementStepProps {
  data: ClaimStatementDraft;
  errors: StatementErrors;
  showErrors: boolean;
  onChange: (field: StatementField, value: string) => void;
  onBlur: (field: StatementField) => void;
  onValidate: () => void;
  onSave: () => void;
  onRestore: () => void;
  onDiscard: () => void;
  onDiscardStale: () => void;
  hasRestoredDraft: boolean;
  restoredPayload: ClaimStatementDraft | null;
  status: RecoverableDraftStatus;
  quarantinedReason: DraftQuarantineReason | null;
  configurationAvailable: boolean;
  summaryRef?: React.RefObject<HTMLDivElement | null>;
}

export function ClaimStatementStep({
  data,
  errors,
  showErrors,
  onChange,
  onBlur,
  onValidate,
  onSave,
  onRestore,
  onDiscard,
  onDiscardStale,
  hasRestoredDraft,
  restoredPayload,
  status,
  quarantinedReason,
  configurationAvailable,
  summaryRef,
}: ClaimStatementStepProps) {
  const errorEntries = Object.entries(errors) as [StatementField, string][];
  const fieldIds: Record<StatementField, string> = {
    title: 'claim-statement-title',
    category: 'claim-statement-category',
    geographicScope: 'claim-statement-geographic-scope',
    verificationContext: 'claim-statement-verification-context',
  };
  const labels: Record<StatementField, string> = {
    title: 'Title',
    category: 'Category',
    geographicScope: 'Geographic scope',
    verificationContext: 'Verification context',
  };

  function fieldError(field: StatementField) {
    return showErrors ? errors[field] : undefined;
  }

  function describedBy(field: StatementField, hintId: string) {
    return fieldError(field) ? `${fieldIds[field]}-error` : hintId;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12" aria-labelledby="claim-statement-heading">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">Claim submission / Step 1</p>
        <h1 id="claim-statement-heading" className="text-3xl font-semibold text-slate-950">Write your claim statement</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
          Describe what happened, where it applies, and how it can be verified. Your statement is saved only on this device.
        </p>
      </div>

      {hasRestoredDraft && restoredPayload && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-emerald-700 bg-emerald-50 p-4" role="status">
          <p className="text-sm text-slate-900">A saved statement is available. Review it before restoring.</p>
          <button type="button" onClick={onRestore} className="min-h-11 rounded px-4 font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Restore saved statement
          </button>
        </div>
      )}

      {status === 'quarantined' && (
        <div className="mb-6 border-l-4 border-amber-700 bg-amber-50 p-4" role="alert">
          <p className="font-semibold text-slate-950">Saved statement not restored</p>
          <p className="mt-1 text-sm text-slate-800">
            {quarantinedReason === 'release-change'
              ? 'This draft belongs to a different protocol release and cannot be used here.'
              : 'This draft belongs to a different account or network and cannot be used here.'}
          </p>
          <button type="button" onClick={onDiscardStale} className="mt-3 min-h-11 rounded px-3 font-semibold text-amber-950 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Discard stale statement
          </button>
        </div>
      )}

      {!configurationAvailable && (
        <div className="mb-6 border-l-4 border-amber-700 bg-amber-50 p-4" role="status">
          <p className="font-semibold text-slate-950">Draft saving is unavailable</p>
          <p className="mt-1 text-sm text-slate-800">A pinned protocol release is not configured. No draft will be stored and no next-step action is available.</p>
        </div>
      )}

      {showErrors && errorEntries.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} className="mb-6 border-l-4 border-red-700 bg-red-50 p-4 text-slate-950 focus:outline focus:outline-2 focus:outline-offset-2" role="alert" aria-labelledby="claim-statement-error-heading">
          <h2 id="claim-statement-error-heading" className="font-semibold">Review these fields</h2>
          <ul className="mt-2 list-inside list-disc">
            {errorEntries.map(([field, message]) => (
              <li key={field}><a className="underline underline-offset-2" href={`#${fieldIds[field]}`}>{labels[field]}: {message}</a></li>
            ))}
          </ul>
        </div>
      )}

      <form className="space-y-6" noValidate onSubmit={(event) => { event.preventDefault(); onValidate(); }}>
        <div>
          <label htmlFor={fieldIds.title} className="mb-2 block font-medium text-slate-950">Title</label>
          <input id={fieldIds.title} name="title" required maxLength={TITLE_MAX_LENGTH} value={data.title}
            onChange={(event) => onChange('title', event.target.value)} onBlur={() => onBlur('title')}
            aria-invalid={Boolean(fieldError('title'))} aria-describedby={describedBy('title', 'claim-statement-title-hint')}
            className="min-h-12 w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700" />
          <p id="claim-statement-title-hint" className="mt-1 text-sm text-slate-700">5 to {TITLE_MAX_LENGTH} characters.</p>
          {fieldError('title') && <p id={`${fieldIds.title}-error`} className="mt-1 text-sm font-medium text-red-800">{fieldError('title')}</p>}
        </div>

        <div>
          <label htmlFor={fieldIds.category} className="mb-2 block font-medium text-slate-950">Category</label>
          <select id={fieldIds.category} name="category" required value={data.category}
            onChange={(event) => onChange('category', event.target.value)} onBlur={() => onBlur('category')}
            aria-invalid={Boolean(fieldError('category'))} aria-describedby={describedBy('category', 'claim-statement-category-hint')}
            className="min-h-12 w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
            <option value="">Select a category</option>
            {PREDEFINED_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <p id="claim-statement-category-hint" className="mt-1 text-sm text-slate-700">Choose the closest matching topic.</p>
          {fieldError('category') && <p id={`${fieldIds.category}-error`} className="mt-1 text-sm font-medium text-red-800">{fieldError('category')}</p>}
        </div>

        <div>
          <label htmlFor={fieldIds.geographicScope} className="mb-2 block font-medium text-slate-950">Geographic scope</label>
          <input id={fieldIds.geographicScope} name="geographicScope" required maxLength={MAX_GEOGRAPHIC_SCOPE_LENGTH} value={data.geographicScope}
            onChange={(event) => onChange('geographicScope', event.target.value)} onBlur={() => onBlur('geographicScope')}
            aria-invalid={Boolean(fieldError('geographicScope'))} aria-describedby={describedBy('geographicScope', 'claim-statement-scope-hint')}
            className="min-h-12 w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700" />
          <p id="claim-statement-scope-hint" className="mt-1 text-sm text-slate-700">Where does the claim apply? Avoid including private personal details.</p>
          {fieldError('geographicScope') && <p id={`${fieldIds.geographicScope}-error`} className="mt-1 text-sm font-medium text-red-800">{fieldError('geographicScope')}</p>}
        </div>

        <div>
          <label htmlFor={fieldIds.verificationContext} className="mb-2 block font-medium text-slate-950">Verification context</label>
          <textarea id={fieldIds.verificationContext} name="verificationContext" required rows={5} maxLength={MAX_VERIFICATION_CONTEXT_LENGTH} value={data.verificationContext}
            onChange={(event) => onChange('verificationContext', event.target.value)} onBlur={() => onBlur('verificationContext')}
            aria-invalid={Boolean(fieldError('verificationContext'))} aria-describedby={describedBy('verificationContext', 'claim-statement-context-hint')}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700" />
          <p id="claim-statement-context-hint" className="mt-1 text-sm text-slate-700">What would help an independent reviewer verify this claim? Do not include passwords, keys, or other secrets.</p>
          {fieldError('verificationContext') && <p id={`${fieldIds.verificationContext}-error`} className="mt-1 text-sm font-medium text-red-800">{fieldError('verificationContext')}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <div aria-live="polite" className="min-h-6 text-sm text-slate-700">
            {status === 'saved-local' && 'Draft saved on this device.'}
            {status === 'dirty' && 'Unsaved changes.'}
            {status === 'save-failed' && 'Draft could not be saved in this browser.'}
            {status === 'rejected' && 'A stored draft was invalid and was not restored.'}
          </div>
          <div className="flex flex-wrap gap-3">
            {(status === 'saved-local' || status === 'dirty' || status === 'save-failed') && (
              <button type="button" onClick={onDiscard} className="min-h-11 rounded border border-slate-500 px-4 font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                Discard draft
              </button>
            )}
            <button type="button" onClick={onSave} disabled={!configurationAvailable} className="min-h-11 rounded border border-emerald-800 px-4 font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              Save draft
            </button>
            <button type="submit" className="min-h-11 rounded bg-emerald-800 px-5 font-semibold text-white hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              Review statement
            </button>
            <button type="button" disabled aria-describedby="claim-statement-next-unavailable" className="min-h-11 rounded bg-slate-200 px-4 font-semibold text-slate-600 disabled:cursor-not-allowed">
              Continue to evidence
            </button>
          </div>
        </div>
        <p id="claim-statement-next-unavailable" className="text-right text-sm text-slate-700">The evidence step is unavailable until its configuration is pinned.</p>
      </form>
    </section>
  );
}

interface ClaimStatementFormProps {
  scope: DraftScope;
  onCancel?: () => void;
}

export default function ClaimStatementForm({ scope }: ClaimStatementFormProps) {
  const configurationAvailable = Boolean(scope.releaseId && scope.releaseId !== 'unknown');
  if (!configurationAvailable) {
    return <UnconfiguredClaimStatementForm />;
  }
  return <ConfiguredClaimStatementForm scope={scope} />;
}

function UnconfiguredClaimStatementForm() {
  const [data, setData] = useState(EMPTY_CLAIM_STATEMENT);
  const [showErrors, setShowErrors] = useState(false);
  const errors = validateClaimStatement(data);

  return (
    <ClaimStatementStep
      data={data}
      errors={errors}
      showErrors={showErrors}
      onChange={(field, value) => setData((current) => ({ ...current, [field]: value }))}
      onBlur={() => undefined}
      onValidate={() => setShowErrors(true)}
      onSave={() => undefined}
      onRestore={() => undefined}
      onDiscard={() => setData(EMPTY_CLAIM_STATEMENT)}
      onDiscardStale={() => undefined}
      hasRestoredDraft={false}
      restoredPayload={null}
      status="clean"
      quarantinedReason={null}
      configurationAvailable={false}
    />
  );
}

function ConfiguredClaimStatementForm({ scope }: { scope: DraftScope }) {
  const [data, setData] = useState(EMPTY_CLAIM_STATEMENT);
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState<Set<StatementField>>(() => new Set());
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = validateClaimStatement(data);
  const hasErrors = Object.keys(errors).length > 0;
  const isDirty = Object.values(data).some((value) => value.trim().length > 0);
  const draft = useRecoverableFormDraft({
    formId: FORM_ID,
    scope,
    payload: data,
    isDirty,
    validatePayload: isClaimStatementDraft,
    autosave: true,
  });

  useEffect(() => {
    if (showErrors && hasErrors) summaryRef.current?.focus();
  }, [showErrors, hasErrors]);

  const updateField = (field: StatementField, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };
  const handleValidate = () => setShowErrors(true);

  return (
    <ClaimStatementStep
      data={data}
      errors={errors}
      showErrors={showErrors || Array.from(touched).some((field) => Boolean(errors[field]))}
      onChange={updateField}
      onBlur={(field) => setTouched((current) => new Set(current).add(field))}
      onValidate={handleValidate}
      onSave={() => draft.saveDraft()}
      onRestore={() => {
        if (draft.restoredPayload) setData(draft.restoredPayload);
        draft.acknowledgeRestoredDraft();
      }}
      onDiscard={() => {
        draft.discardDraft();
        setData(EMPTY_CLAIM_STATEMENT);
      }}
      onDiscardStale={draft.acknowledgeQuarantine}
      hasRestoredDraft={draft.hasRestoredDraft}
      restoredPayload={draft.restoredPayload}
      status={draft.status}
      quarantinedReason={draft.quarantinedReason as DraftQuarantineReason | null}
      configurationAvailable
      summaryRef={summaryRef}
    />
  );
}