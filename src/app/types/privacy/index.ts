/**
 * Privacy Notice — Versioned Content Schema
 *
 * Defines the structure for versioned privacy notice content.
 * Draft content is NEVER published as approved (fail-closed).
 * Testnet and mainnet privacy notices remain distinct.
 * Enforces clear immutable blockchain vs controllable off-chain data boundaries.
 */

export type NetworkType = 'testnet' | 'mainnet';
export type ClauseStatus = 'approved' | 'review' | 'unavailable';

/**
 * Data boundary classification:
 * - 'immutable-chain': Data broadcast to and finalized on decentralized blockchain consensus
 *   (public wallet addresses, transactions, contract state, cryptographic proof digests).
 *   Cannot be modified, rectified, or erased by the operator or users.
 * - 'controllable-off-chain': Ephemeral or server-side off-chain data (session tokens, support
 *   communications, sanitized error logs, local client cache). Subject to retention limits
 *   and deletion upon verified data subject requests.
 */
export type DataBoundary = 'immutable-chain' | 'controllable-off-chain';

export interface PrivacyClause {
  id: string;
  title: string;
  content: string;
  status: ClauseStatus;
  dataBoundary: DataBoundary;
  lastReviewedAt?: string;
  reviewerNotes?: string;
}

export interface PrivacyVersion {
  version: string;
  effectiveDate: string;
  materialChanges: string;
  operator: string;
  previousVersion?: string;
  network: NetworkType;
  clauses: PrivacyClause[];
  status: 'draft' | 'published';
  publishedAt?: string;
  source: 'board' | 'governance' | 'legal';
  lastReviewedAt?: string;
}

export interface PrivacyMetadata {
  currentVersion: string;
  versions: PrivacyVersion[];
  lastUpdated: string;
  network: NetworkType;
  operator: string;
}

export interface PrivacyRenderProps {
  network: NetworkType;
  version?: string;
}

export const PRIVACY_SECTIONS = [
  'wallet-blockchain',
  'session-support',
  'logs',
  'evidence-public-source',
  'processor',
  'retention',
  'request',
  'jurisdiction',
  'revision',
] as const;

export type PrivacySectionId = (typeof PRIVACY_SECTIONS)[number];

export const PRIVACY_SECTION_TITLES: Record<PrivacySectionId, string> = {
  'wallet-blockchain': 'Wallet & Blockchain Data',
  'session-support': 'Session & Support Communications',
  logs: 'Telemetry, Performance & Incident Logs',
  'evidence-public-source': 'Evidence & Public Sources',
  processor: 'Third-Party Processors & Infrastructure',
  retention: 'Data Retention & Finality Schedule',
  request: 'User Rights & Subject Requests',
  jurisdiction: 'Jurisdiction & Regulatory Scope',
  revision: 'Revision History & Amendments',
};

export const PRIVACY_SECTION_DESCRIPTIONS: Record<PrivacySectionId, string> = {
  'wallet-blockchain':
    'Public addresses, cryptographic signatures, and on-chain transaction records committed to Optimism.',
  'session-support':
    'Local session storage, wallet connection state, and voluntary user inquiries submitted to support.',
  logs:
    'Privacy-safe performance telemetry, error reporting, and incident triage logs.',
  'evidence-public-source':
    'Content identifiers (CIDs), URLs, and metadata submitted to substantiate protocol claims.',
  processor:
    'External infrastructure providers including RPC gateways, IPFS nodes, and identity verification partners.',
  retention:
    'Retention periods distinguishing permanent distributed ledger finality from expungeable off-chain records.',
  request:
    'Mechanisms for exercising access, rectification, and erasure rights within technical and consensus limits.',
  jurisdiction:
    'Applicable legal frameworks, international transfers, and supervisory authority contacts.',
  revision:
    'Governance, board, and legal review procedures for adopting versioned updates to this notice.',
};

export const PRIVACY_SECTION_BOUNDARIES: Record<PrivacySectionId, DataBoundary> = {
  'wallet-blockchain': 'immutable-chain',
  'session-support': 'controllable-off-chain',
  logs: 'controllable-off-chain',
  'evidence-public-source': 'immutable-chain',
  processor: 'controllable-off-chain',
  retention: 'controllable-off-chain',
  request: 'controllable-off-chain',
  jurisdiction: 'controllable-off-chain',
  revision: 'controllable-off-chain',
};
