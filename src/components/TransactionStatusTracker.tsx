// src/components/TransactionStatusTracker.tsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { TransactionLifecycleState } from '../hooks/useTransactionLifecycleMonitor';
import { createReceiptFromLifecycleState } from '@/lib/receipts';
import { TransactionReceiptModal } from '@/components/receipts/TransactionReceiptModal';
import type { CanonicalReceiptRecord, ReceiptActionType } from '@/lib/receipts/types';
import { usePublicServiceStatus } from '@/hooks/usePublicServiceStatus';

interface Props {
    txState: TransactionLifecycleState | null;
    action?: ReceiptActionType;
    chainId?: number;
    onSpeedUp?: () => void;
    onCancel?: () => void;
    onDismiss?: () => void;
}

type CanonicalTxStatus =
    | 'idle'
    | 'simulating'
    | 'simulation_failed'
    | 'awaiting_signature'
    | 'rejected'
    | 'submitted'
    | 'pending'
    | 'stuck'
    | 'replaced'
    | 'reverted'
    | 'confirmed'
    | 'finalized'
    | 'indexed'
    | 'projection_lag'
    | 'reorged';

const SUCCESS_STATES: ReadonlySet<CanonicalTxStatus> = new Set(['finalized', 'indexed']);
const AUTHORIZATION_BLOCKING_STATES: ReadonlySet<CanonicalTxStatus> = new Set([
    'idle',
    'simulating',
    'simulation_failed',
    'awaiting_signature',
    'rejected',
    'reverted',
    'replaced',
    'reorged',
]);

const STATUS_LABELS: Record<CanonicalTxStatus, string> = {
    idle: 'Ready to review',
    simulating: 'Simulating',
    simulation_failed: 'Simulation failed',
    awaiting_signature: 'Awaiting signature',
    rejected: 'Rejected in wallet',
    submitted: 'Submitted',
    pending: 'Pending confirmation',
    stuck: 'Stuck — replacement available',
    replaced: 'Replaced by another transaction',
    reverted: 'Reverted on-chain',
    confirmed: 'Confirmed (awaiting finality)',
    finalized: 'Finalized',
    indexed: 'Indexed',
    projection_lag: 'Projection lag — awaiting indexer',
    reorged: 'Reorged — confirmation revoked',
};

const STATUS_TONES: Record<CanonicalTxStatus, string> = {
    idle: 'bg-slate-500/10 text-slate-300',
    simulating: 'bg-indigo-500/10 text-indigo-400',
    simulation_failed: 'bg-rose-500/10 text-rose-400',
    awaiting_signature: 'bg-indigo-500/10 text-indigo-400',
    rejected: 'bg-rose-500/10 text-rose-400',
    submitted: 'bg-indigo-500/10 text-indigo-400',
    pending: 'bg-indigo-500/10 text-indigo-400',
    stuck: 'bg-amber-500/10 text-amber-400 animate-pulse',
    replaced: 'bg-amber-500/10 text-amber-400',
    reverted: 'bg-rose-500/10 text-rose-400',
    confirmed: 'bg-emerald-500/10 text-emerald-400',
    finalized: 'bg-emerald-500/10 text-emerald-400',
    indexed: 'bg-emerald-500/10 text-emerald-400',
    projection_lag: 'bg-amber-500/10 text-amber-400',
    reorged: 'bg-rose-500/10 text-rose-400',
};

const STATUS_GLYPHS: Record<CanonicalTxStatus, string> = {
    idle: '•',
    simulating: '🔄',
    simulation_failed: '⚠',
    awaiting_signature: '✎ ',
    rejected: '✕',
    submitted: '↗',
    pending: '🔄',
    stuck: '⏳',
    replaced: '↻',
    reverted: '↺',
    confirmed: '✓',
    finalized: '✓',
    indexed: '✓',
    projection_lag: '…',
    reorged: '⚠',
};

const normalizeStatus = (status: string): CanonicalTxStatus => {
    if (status in STATUS_LABELS) return status as CanonicalTxStatus;
    return 'pending';
};

export const TransactionStatusTracker: React.FC<Props> = ({
    txState,
    action = 'claim',
    chainId = 11155420,
    onSpeedUp,
    onCancel,
    onDismiss,
}) => {
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receipt, setReceipt] = useState<CanonicalReceiptRecord | null>(null);
    const { status: publicStatus, freshness } = usePublicServiceStatus();

    if (!txState) return null;

    const status = normalizeStatus(txState.status);
    const isPendingOrStuck = status === 'pending' || status === 'stuck';
    const isSuccess = SUCCESS_STATES.has(status);
    const authorizationBlocked = AUTHORIZATION_BLOCKING_STATES.has(status);
    const statusLabel = STATUS_LABELS[status];
    const statusTone = STATUS_TONES[status];
    const statusGlyph = STATUS_GLYPHS[status];
    const isStale = freshness === 'stale' || freshness === 'missing';
    const isDegraded = publicStatus?.overall === 'degraded' || publicStatus?.overall === 'partial';
    const isUnavailable = publicStatus?.overall === 'unavailable';
    const isDelayed = publicStatus?.overall === 'delayed';

    const handleOpenReceipt = () => {
        try {
            const rec = createReceiptFromLifecycleState(action, txState, {
                chainId,
            });
            setReceipt(rec);
            setIsReceiptOpen(true);
        } catch (err) {
            console.error('Failed to generate receipt', err);
        }
    };

    return (
        <>
            <div
                className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-2xl text-slate-100 animate-slide-up motion-reduce:animate-none"
                role="status"
                aria-live={isSuccess ? 'polite' : 'assertive'}
                aria-atomic="true"
                data-tx-status={status}
                data-tx-success={isSuccess ? 'true' : 'false'}
                data-tx-authorization-blocked={authorizationBlocked ? 'true' : 'false'}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${statusTone}`}
                            aria-hidden="true"
                        >
                            {statusGlyph}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold">{statusLabel}</h4>
                            {txState.hash ? (
                                <p className="text-[10px] text-slate-400 font-mono">
                                    {txState.hash.slice(0, 8)}...{txState.hash.slice(-6)}
                                </p>
                            ) : (
                                <p className="text-[10px] text-slate-500 font-mono">
                                    No transaction hash yet
                                </p>
                            )}
                        </div>
                    </div>
                    {onDismiss && (
                        <button onClick={onDismiss} aria-label="Dismiss status notification" className="text-slate-500 hover:text-slate-300 text-xs">
                            ✕
                        </button>
                    )}
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    {txState.message}
                </p>

                {(isStale || isDegraded || isUnavailable || isDelayed) && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-3 rounded-lg border border-amber-700/50 bg-amber-950/40 p-2.5 text-[11px] leading-relaxed text-amber-200"
                    >
                        <span className="font-semibold">Service status: </span>
                        {isUnavailable && 'Unavailable — observations could not be retrieved.'}
                        {isStale && 'Stale — last observation is outdated; do not treat as healthy.'}
                        {isDelayed && 'Delayed — observations are lagging behind.'}
                        {isDegraded && 'Degraded or partial — some dependencies are not reporting.'}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {isPendingOrStuck && (
                        <div className="flex space-x-2">
                            {onSpeedUp && (
                                <button
                                    onClick={onSpeedUp}
                                    className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-medium transition-colors"
                                >
                                    Speed Up (Replace)
                                </button>
                            )}
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-medium transition-colors text-slate-300"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleOpenReceipt}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                        aria-label="Download or view transaction receipt"
                    >
                        <Download className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        <span>Download Receipt</span>
                    </button>
                </div>
            </div>

            {receipt && (
                <TransactionReceiptModal
                    receipt={receipt}
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                />
            )}
        </>
    );
};