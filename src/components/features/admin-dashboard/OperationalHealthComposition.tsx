'use client';

import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Clock, Database } from 'lucide-react';

export interface OperationalHealthCompositionProps {
  observations?: any[];
  compositeStatus?: string;
  freshnessLabel?: string;
  finalizedBlock?: number | string | null;
  abiManifestVerification?: {
    verified?: boolean;
    status?: string;
    details?: string;
  } | boolean | null;
  affectedScope?: string[] | string | null;
  isLoading?: boolean;
  className?: string;
}

export function OperationalHealthComposition({
  observations = [],
  compositeStatus = 'healthy',
  freshnessLabel = 'Fresh',
  finalizedBlock = null,
  abiManifestVerification = null,
  affectedScope = null,
  isLoading = false,
  className = '',
}: OperationalHealthCompositionProps) {
  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl border border-border bg-card animate-pulse space-y-2 ${className}`}>
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-6 w-24 bg-muted rounded" />
      </div>
    );
  }

  const isAbiVerified =
    typeof abiManifestVerification === 'boolean'
      ? abiManifestVerification
      : abiManifestVerification?.verified ?? true;

  const scopeList = Array.isArray(affectedScope)
    ? affectedScope
    : affectedScope
    ? [affectedScope]
    : [];

  return (
    <section
      aria-label="Operational Health & Infrastructure Composition"
      className={`p-4 rounded-xl border border-border bg-card text-card-foreground space-y-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight">Operational Infrastructure Health</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {freshnessLabel}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-medium text-[11px] border ${
              compositeStatus === 'healthy'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
            }`}
          >
            {compositeStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
        {finalizedBlock && (
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden="true" />
            <span>Finalized Block: {finalizedBlock}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {isAbiVerified ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" aria-hidden="true" />
          )}
          <span>ABI/Manifest: {isAbiVerified ? 'Verified' : 'Unverified'}</span>
        </div>
        {scopeList.length > 0 && (
          <div className="text-[11px] text-amber-500/90 truncate">
            Affected Scope: {scopeList.join(', ')}
          </div>
        )}
      </div>

      {observations.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {observations.map((obs, idx) => (
            <div
              key={obs.id || idx}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs"
            >
              <span className="font-medium">{obs.label || obs.scope || `Observation ${idx + 1}`}</span>
              <span className="capitalize text-muted-foreground">{obs.state || obs.status || 'recorded'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export default OperationalHealthComposition;
