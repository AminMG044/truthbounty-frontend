import type {
  AdminDashboardOverview,
  AdminReadiness,
  CapabilityContext,
  ExecuteOperationRequest,
  ExecuteOperationResponse,
} from '@/app/types/admin';

/**
 * Privileged entry is read-only by default. Context selection never grants
 * authority; contracts remain canonical for mutations and API data is
 * freshness-labelled projection data only.
 */
export const DEFAULT_CAPABILITY_CONTEXT: CapabilityContext = 'read-only';

export interface AdminRequestOptions {
  /** Selected capability context. Never grants authority on its own. */
  context?: CapabilityContext;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

function buildAdminHeaders(
  adminAddress: string,
  context: CapabilityContext
): Record<string, string> {
  return {
    Accept: 'application/json',
    'x-admin-address': adminAddress,
    'x-capability-context': context,
  };
}

async function parseAdminError(res: Response): Promise<Error> {
  const errorBody = await res.json().catch(() => ({}));
  const reason = errorBody.reason || errorBody.error || `HTTP ${res.status}`;
  const err = new Error(reason);
  (err as { status?: number }).status = res.status;
  return err;
}

export async function fetchAdminReadiness(
  adminAddress: string,
  options: AdminRequestOptions = {}
): Promise<AdminReadiness> {
  const context = options.context ?? DEFAULT_CAPABILITY_CONTEXT;
  const res = await fetch('/api/admin/readiness', {
    method: 'GET',
    headers: buildAdminHeaders(adminAddress, context),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throw await parseAdminError(res);
  }

  return res.json();
}

export async function fetchAdminOverview(
  adminAddress: string,
  options: AdminRequestOptions = {}
): Promise<AdminDashboardOverview> {
  const context = options.context ?? DEFAULT_CAPABILITY_CONTEXT;
  const res = await fetch('/api/admin/overview', {
    method: 'GET',
    headers: buildAdminHeaders(adminAddress, context),
    cache: 'no-store',
    signal: options.signal,
  });

  if (!res.ok) {
    throw await parseAdminError(res);
  }

  return res.json();
}

export async function executeAdminOperation(
  payload: ExecuteOperationRequest
): Promise<ExecuteOperationResponse> {
  const res = await fetch('/api/admin/operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-admin-address': payload.operatorAddress,
      'x-capability-context': payload.context ?? DEFAULT_CAPABILITY_CONTEXT,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await parseAdminError(res);
  }

  return res.json();
}