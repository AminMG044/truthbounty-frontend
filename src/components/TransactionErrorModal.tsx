import React from 'react';
import type { NormalizedError } from '../hooks/useTransactionErrorHandler';

/**
 * Transaction-state authority for the claim review/authorization boundary.
 *
 * Per UI-FE-014, no success may be shown at click, signature, or hash receipt.
 * The states below are mutually exclusive and must remain distinct:
 * rejected, replaced, reverted, finalized, projection-lag, and reorged.
 *
 * Contract state is canonical for mutations; API data is a freshness-labelled
 * projection. Unpinned release or simulation failure disables authorization.
 */
export type TransactionState =
    | 'idle'
    | 'review'
    | 'simulating'
    | 'simulation-failed'
    | 'awaiting-signature'
    | 'rejected'
    | 'submitted'
    | 'replaced'
    | 'reverted'
    | 'confirmed'
    | 'finalized'
    | 'projection-lag'
    | 'reorged'
    | 'indexed';

export interface TransactionAuthority {
    /** Pinned adapter release; unpinned disables authorization. */
    pinnedRelease: string | null;
    /** Whether the simulation succeeded. Failure disables authorization. */
    simulationOk: boolean;
    /** Canonical chain id (Optimism/EVM only). */
    chainId: number;
    /** Canonical contract address. */
    contract: string;
    /** Canonical method selector/name. */
    method: string;
    /** Canonical parameters. */
    parameters: Record<string, unknown>;
    /** Recoverable transaction reference (hash) once submitted. */
    txHash?: string;
    /** Freshness label for any API projection. */
    projectionFreshness?: 'fresh' | 'stale' | 'lagging';
}

interface Props {
    error: NormalizedError | null;
    onClose: () => void;
    onRetry?: () => void;
    /** Canonical transaction state; defaults to idle. */
    state?: TransactionState;
    /** Authority context; when absent, authorization is unavailable. */
    authority?: TransactionAuthority | null;
}

const isAuthorizationEnabled = (authority?: TransactionAuthority | null): boolean => {
    if (!authority) return false;
    if (!authority.pinnedRelease) return false;
    if (!authority.simulationOk) return false;
    return true;
};

export const TransactionErrorModal: React.FC<Props> = ({
    error,
    onClose,
    onRetry,
    state = 'idle',
    authority = null,
}) => {
    if (!error) return null;

    const authorizationEnabled = isAuthorizationEnabled(authority);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${error.isUserRejection ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`>
                        {error.isUserRejection ? '⚠️' : '❌'}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{error.title}</h3>
                        <p className="text-xs text-slate-400">Optimism Mainnet / Testnet V2 Client</p>
                    </div>
                </div>

                <dl
                    className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400"
                    data-testid="tx-authority-summary"
                >
                    <dt className="text-slate-500">State</dt>
                    <dd data-testid="tx-state">{state}</dd>
                    <dt className="text-slate-500">Chain</dt>
                    <dd>{authority ? `eip155:${authority.chainId}` : 'unavailable'}</dd>
                    <dt className="text-slate-500">Contract</dt>
                    <dd className="truncate">{authority?.contract ?? 'unavailable'}</dd>
                    <dt className="text-slate-500">Method</dt>
                    <dd>{authority?.method ?? 'unavailable'}</dd>
                    <dt className="text-slate-500">Pinned release</dt>
                    <dd>{authority?.pinnedRelease ?? 'unpinned'}</dd>
                    <dt className="text-slate-500">Simulation</dt>
                    <dd>{authority?.simulationOk ? 'ok' : 'failed'}</dd>
                    <dt className="text-slate-500">Projection</dt>
                    <dd>{authority?.projectionFreshness ?? 'unknown'}</dd>
                    {authority?.txHash && (
                        <>
                            <dt className="text-slate-500">Tx ref</dt>
                            <dd className="truncate font-mono">{authority.txHash}</dd>
                        </>
                    )}
                </dl>

                <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    {error.message}
                </p>

                <div className="flex space-x-3">
                    {error.retryable && onRetry && (
                        <button
                            onClick={() => { onClose(); onRetry(); }}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={!authorizationEnabled}
                        aria-disabled={!authorizationEnabled}
                        data-testid="authorize-button"
                        title={
                            authorizationEnabled
                                ? 'Authorize claim submission'
                                : 'Authorization unavailable: unpinned release or simulation failure'
                        }
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 py-2.5 text-sm font-medium transition-colors"
                    >
                        Authorize
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-medium transition-colors text-slate-300"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
