'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, KeyRound, ExternalLink } from 'lucide-react';
import { APP_ROUTES } from '@/config/navigation';

export type AdminDeniedReason =
  | 'denied'
  | 'revoked'
  | 'stale'
  | 'wrong-chain'
  | 'unavailable'
  | 'not-connected'
  | null;

export interface AdminUnauthorizedStateProps {
  reason: AdminDeniedReason;
  canonicalAdminAddress?: string;
  connectedAddress?: string | null;
  expectedChainId?: number;
  actualChainId?: number | null;
  onConnect?: () => void;
  className?: string;
}

const REASON_COPY: Record<Exclude<AdminDeniedReason, null>, { title: string; detail: string }> = {
  denied: {
    title: 'Privileged Access Denied',
    detail:
      'The connected wallet is not recognized as an authorized operator for this capability. Authority is resolved from the canonical contract registry on Optimism.',
  },
  revoked: {
    title: 'Privileged Authority Revoked',
    detail:
      'The authority source for this capability has been revoked on-chain. Re-granting requires a governance operation; the UI holds no authority.',
  },
  stale: {
    title: 'Privileged Authority Stale',
    detail:
      'The authority expiry or freshness window has elapsed. Refresh from the canonical contracts before attempting any operation.',
  },
  'wrong-chain': {
    title: 'Wrong Network',
    detail:
      'Privileged capabilities are only available on Optimism. Switch the connected wallet to the expected chain before continuing.',
  },
  unavailable: {
    title: 'Privileged Readiness Unavailable',
    detail:
      'Authority data could not be resolved from the canonical contracts and freshness-labelled projections. Actions remain unavailable until readiness is confirmed.',
  },
  'not-connected': {
    title: 'Operator Wallet Required',
    detail:
      'Connect an Optimism wallet to resolve privileged readiness. Connecting a context grants nothing; authority is evaluated against canonical contracts and expiry windows.',
  },
};

function truncateAddress(address: string): string {
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

export function AdminUnauthorizedState({
  reason,
  canonicalAdminAddress,
  connectedAddress,
  expectedChainId,
  actualChainId,
  className = '',
}: AdminUnauthorizedStateProps) {
  const key = reason ?? 'not-connected';
  const copy = REASON_COPY[key];
  const isWrongChain = key === 'wrong-chain';
  const isUnavailable = key === 'unavailable';
  const isNotConnected = key === 'not-connected';

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="admin-unauthorized-notice"
      data-reason={key}
      className={`mx-auto max-w-4xl rounded-2xl border border-destructive/40 bg-card p-6 sm:p-8 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-destructive/15 p-3 text-destructive shrink-0">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-destructive font-medium">{copy.detail}</p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Canonical Admin Authority:</span>
              <span className="font-mono text-foreground font-semibold">
                {canonicalAdminAddress
                  ? truncateAddress(canonicalAdminAddress)
                  : 'Configured in release/roles'}
              </span>
            </div>
            {connectedAddress && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Connected Wallet Address:</span>
                <span className="font-mono text-foreground">
                  {truncateAddress(connectedAddress)}
                </span>
              </div>
            )}
            {isWrongChain && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Expected Chain:</span>
                <span className="font-mono text-foreground">
                  {expectedChainId !== undefined ? `Optimism (${expectedChainId})` : 'Optimism'}
                </span>
              </div>
            )}
            {isWrongChain && actualChainId !== null && actualChainId !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Connected Chain:</span>
                <span className="font-mono text-foreground">{`Chain ${actualChainId}`}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Enforcement Layer:</span>
              <span className="text-primary font-medium">Canonical Contract Registry &amp; Server API Gate</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            TruthBounty enforces strict cryptographic role separation across operations, governance, and guardian capability contexts. Selecting a context grants nothing; operational routes require contract-level verification against deployed Optimism artifacts and valid expiry windows.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!(isUnavailable || isWrongChain) && (
              <Link
                href={APP_ROUTES.IDENTITY}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isNotConnected ? 'Connect Operator Wallet' : 'Review Wallet Authority'}</span>
              </Link>
            )}
            <Link
              href={APP_ROUTES.DASHBOARD}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to Public Dashboard</span>
            </Link>
            {isUnavailable && (
              <a
                href="https://github.com/DigiNodes/truthbounty-protocol/blob/main/docs/ux-authority/FRONTEND_IMPLEMENTATION_MATRIX.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Frontend Implementation Matrix</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}