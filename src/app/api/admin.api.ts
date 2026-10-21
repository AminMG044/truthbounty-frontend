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

export type HealthObservationState =
  | 'healthy'
  | 'degraded'
  | 'delayed'
  | 'stale'
  | 'unavailable';

export interface HealthObservation {
  state: HealthObservationState;
  observedAt: string | null;
  freshnessMs: number | null;
  detail?: string;
}

export interface HealthSubject {
  id: 'api' | 'rpc' | 'indexer' | 'database' | 'release' | 'abi' | 'manifest';
  label: string;
  observation: HealthObservation;
  affectedScope?: string[];
  thirdParty?: boolean;
}

export interface OperationalHealthReport {
  subjects: HealthSubject[];
  finalizedBlock: number | null;
  finalizedBlockObservedAt: string | null;
  generatedAt: string;
  overall: HealthObservationState;
  disclaimer: string[];
}

const OBSERVATION_PRECEEDENCE_ORDER: HealthObservationState[] = [
  'unavailable',
  'stale',
  'delayed',
  'degraded',
  'healthy',
];

export function composeOverallHealth(
  subjects: HealthSubject[]
): HealthObservationState {
  if (subjects.length === 0) {
    return 'unavailable';
  }

  let worstIdx = OBSERVATION_PRECEEDENCE_ORDER.length - 1;
  for (const subject of subjects) {
    const idx = OBSERVATION_PRECEEDENCE_ORDER.indexOf(subject.observation.state);
    if (idx >= 0 && idx < worstIdx) {
      worstIdx = idx;
    }
  }

  return OBSERVATION_PRECEEDENCE_ORDER[worstIdx];
}

function normalizeObservation(raw: unknown): HealthObservation {
  if (!raw || typeof raw !== 'object') {
    return { state: 'unavailable', observedAt: null, freshnessMs: null };
  }

  const candidate = raw as Record<string, unknown>;
  const state = candidate.state;
  if (
    typeof state !== 'string' ||
    !OBSERVATION_PRECEEDENCE_ORDER.includes(state as HealthObservationState)
  ) {
    return {
      state: 'unavailable',
      observedAt: null,
      freshnessMs: null,
      detail: typeof candidate.detail === 'string' ? candidate.detail : undefined,
    };
  }

  const observedAt = typeof candidate.observedAt === 'string' ? candidate.observedAt : null;
  const freshnessMs =
    typeof candidate.freshnessMs === 'number' && Number.isFinite(candidate.freshnessMs)
      ? candidate.freshnessMs
      : null;

  if (observedAt === null) {
    return {
      state: 'unavailable',
      observedAt: null,
      freshnessMs: null,
      detail: typeof candidate.detail === 'string' ? candidate.detail : undefined,
    };
  }

  return {
    state: state as HealthObservationState,
    observedAt,
    freshnessMs,
    detail: typeof candidate.detail === 'string' ? candidate.detail : undefined,
  };
}

function normalizeSubject(raw: unknown, idx: number): HealthSubject {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = candidate.id;
  const label = candidate.label;
  const affectedScope = Array.isArray(candidate.affectedScope)
    ? candidate.affectedScope.filter((v): v is string => typeof v === 'string')
    : undefined;

  return {
    id: typeof id === 'string' ? (id as HealthSubject['id']) : ('api' as HealthSubject['id']),
    label: typeof label === 'string' ? label : `Subject ${idx + 1}`,
    observation: normalizeObservation(candidate.observation),
    affectedScope,
    thirdParty: candidate.thirdParty === true,
  };
}

export function normalizeOperationalHealth(
  raw: unknown,
  generatedAt: string = new Date().toISOString()
): OperationalHealthReport {
  const candidate = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const subjects = Array.isArray(candidate.subjects)
    ? candidate.subjects.map((s, i) => normalizeSubject(s, i))
    : [];

  const finalizedBlock =
    typeof candidate.finalizedBlock === 'number' && Number.isFinite(candidate.finalizedBlock)
      ? candidate.finalizedBlock
      : null;
  const finalizedBlockObservedAt =
    typeof candidate.finalizedBlockObservedAt === 'string'
      ? candidate.finalizedBlockObservedAt
      : null;

  const disclaimers = Array.isArray(candidate.disclaimers)
    ? candidate.disclaimers.filter((v): v is string => typeof v === 'string')
    : [];

  const defaultDisclaimers = [
    'Third-party dependency status is not a TruthBounty guarantee.',
    'Operational status does not change protocol truth.',
  ];

  return {
    subjects,
    finalizedBlock,
    finalizedBlockObservedAt,
    generatedAt,
    overall: composeOverallHealth(subjects),
    disclaimers: [...new Set([...disclaimers, ...defaultDisclaimers])],
  };
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

export async function fetchOperationalHealth(
  adminAddress: string
): Promise<OperationalHealthReport> {
  const res = await fetch('/api/admin/health', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-admin-address': adminAddress,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const reason = errorBody.reason || errorBody.error || `HTTP ${res.status}`;
    const err = new Error(reason);
    (err as { status?: number }).status = res.status;
    throw err;
  }

  const body = await res.json();
  return normalizeOperationalHealth(body);
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