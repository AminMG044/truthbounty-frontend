/**
 * Privacy Notice — Mainnet Configuration
 *
 * Mainnet privacy terms govern production, value-bearing protocol interactions.
 * Draft content is NEVER published as approved (fail-closed).
 * Operates on Optimism Mainnet (Chain ID: 10).
 * Enforces clear distinction between permanent on-chain ledger records and controllable off-chain data.
 */

import type { PrivacyVersion, PrivacyMetadata, PrivacyClause } from '@/app/types/privacy';

export const MAINNET_PRIVACY_CLAUSES_V1: PrivacyClause[] = [
  {
    id: 'wallet-blockchain',
    title: 'Wallet & Blockchain Data',
    content: `1.1. Production Blockchain Transparency: TruthBounty mainnet smart contracts run on Optimism Mainnet (Ethereum Layer 2). When you interact with protocol contracts—including creating claims, bonding collateral, participating in verification rounds, disputing outcomes, or claiming earned bounties—your transactions, public address, cryptographic signatures, token transfers, and block execution timestamps are permanently recorded on the blockchain ledger.

1.2. Absolute Consensus Immutability: Blockchain records are mathematically secured across a decentralized validator set. No administrator, foundation, governance body, or court order can delete, redact, or rewrite transaction history once finalized on Optimism and Ethereum L1.

1.3. Identity Linkage & Pseudonymity: Your public wallet address acts as your protocol identifier. If your wallet address has been linked with external KYC verifications, centralized exchanges, social media handles, or ENS names, any third party can trace your full transaction history and protocol interactions on block explorers.

1.4. Non-Custodial Security: The TruthBounty interface is entirely non-custodial. The protocol never accesses, logs, or stores private keys or seed phrases. You maintain exclusive responsibility for your credentials.`,
    status: 'approved',
    dataBoundary: 'immutable-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'session-support',
    title: 'Session & Support Communications',
    content: `2.1. Client Session Persistence: To provide a resilient user experience, the interface stores minimal operational state locally in your browser (e.g., active chain selection, dark/light theme, uncommitted claim wizard drafts, cached token balances). This data remains client-side.

2.2. Production Support Requests: When you contact protocol support or operations teams, communications (including contact address, issue category, and description) are processed solely for the purpose of investigating and resolving your operational inquiry.

2.3. Secret Scrubbing: Support input interfaces actively enforce pattern-based secret redaction. Any raw private keys, mnemonic phrases, or session secrets entered into support message forms are intercepted and blocked before transmission.

2.4. Controllable Processing: Support records are stored in encrypted off-chain stores with restricted operational role-based access and are permanently expunged in accordance with our retention policy.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'logs',
    title: 'Telemetry, Performance & Incident Logs',
    content: `3.1. Strict Opt-In Policy: In accordance with our core privacy architecture, telemetry and error reporting are disabled by default. Telemetry is collected only when explicitly enabled through configuration.

3.2. Sanitized Error & Performance Tracking: When active, our telemetry client redacts all sensitive user data, including wallet addresses, IP addresses, private keys, authorization headers, and raw evidence content before sending. Payloads contain only generalized component error boundaries, network response status codes, and aggregate latency metrics.

3.3. Incident Response: Security incident and RPC quorum failover events generate sanitized telemetry to alert operations maintainers of degraded contract availability without collecting personal user profiles.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'evidence-public-source',
    title: 'Evidence & Public Sources',
    content: `4.1. Public Evidence Requirement: TruthBounty is a public verification and bounty protocol. Evidence submitted in support of claims—including web references, documents, archives, and IPFS CIDs—is intentionally made public to allow verifiers and dispute arbiters to audit veracity.

4.2. Permanent IPFS Availability: Content identifiers (CIDs) and cryptographic hashes pinned to IPFS and committed on-chain cannot be deleted or unpinned across independent network mirrors.

4.3. No Sensitive Personal Data: Users must strictly refrain from uploading private medical, biometric, financial, or personally identifiable information as public claim evidence. The protocol interface truncates and sanitizes rendered evidence strings to safeguard against malicious script execution.`,
    status: 'approved',
    dataBoundary: 'immutable-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'processor',
    title: 'Third-Party Processors & Infrastructure',
    content: `5.1. RPC Node Gateways: Interacting with the protocol requires transmitting signed payloads to Optimism RPC node providers (e.g., Infura, Alchemy, public sequencer). These providers may log IP addresses and request metadata under their own independent terms of service.

5.2. IPFS Storage Gateways: Decentralized evidence files are loaded via IPFS gateway infrastructure. Gateways log cache hits and IP requests for DDoS prevention and bandwidth allocation.

5.3. Identity Verification (World ID): When utilizing optional World ID human verification, the interface uses zero-knowledge cryptography to prove unique humanity. Zero-knowledge nullifiers prevent reverse-engineering of user identities and iris biometric data is never touched or stored by TruthBounty.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'retention',
    title: 'Data Retention & Finality Schedule',
    content: `6.1. Immutable On-Chain Retention: All data written to the Optimism blockchain is permanently retained as part of the immutable public ledger. It cannot be altered, replaced, or deleted.

6.2. Controllable Off-Chain Retention Schedule:
   - Client-side cache: Retained locally until purged by the user or browser storage limits.
   - Support communications: Retained for 90 days following ticket resolution, then automatically erased.
   - Diagnostic and error telemetry: Retained for a rolling 30-day period, then permanently purged from log collectors.
   - Off-chain indexer database: Reconstructed solely from publicly accessible on-chain events and IPFS records.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'request',
    title: 'User Rights & Subject Requests',
    content: `7.1. Applicable Data Subject Rights: Users possess legal rights to request confirmation of whether their personal data is processed, obtain copies of controllable off-chain records, and demand the rectification or erasure of inaccurate or unlawfully processed off-chain information.

7.2. Inherent Blockchain Architectural Limitation: In accordance with global regulatory guidance regarding public distributed ledgers, data subjects acknowledge that blockchain records are immutable. Requests for erasure, modification, or rectification cannot be executed against confirmed transactions, public wallet addresses, contract state, or IPFS cryptographic digests.

7.3. Verification & Submission: To exercise rights regarding controllable off-chain systems, contact the protocol team via established governance communication channels with cryptographic proof of address ownership where applicable.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'jurisdiction',
    title: 'Jurisdiction & Regulatory Scope',
    content: `8.1. Governing Framework: This production Privacy Notice is established under the laws of the Cayman Islands, without regard to conflict of laws principles.

8.2. Decentralized Operation: The TruthBounty frontend connects directly to autonomous decentralized smart contracts. Participants accessing the interface from various jurisdictions are responsible for compliance with local data protection and digital asset regulations.

8.3. Cross-Border Transfers: As a decentralized protocol interface, off-chain communication channels and decentralized RPC endpoints operate globally across multiple jurisdictions.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'revision',
    title: 'Revision History & Amendments',
    content: `9.1. Governance Timelock & Adoption: Amendments to this Mainnet Privacy Notice require review by legal counsel and adoption via TruthBounty Protocol Governance. Material changes follow a timelock schedule prior to effective date.

9.2. Strict Versioning & Publication: Non-approved drafts remain tagged with review or draft state and are not effective. Only approved versions published following formal resolution are effective.

9.3. Traceability: Prior versions, publication timestamps, and diffs are maintained permanently in the version history for full transparency and regulatory auditability.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
];

export const MAINNET_PRIVACY_VERSIONS: PrivacyVersion[] = [
  {
    version: '1.0.0',
    effectiveDate: '2026-06-01',
    materialChanges:
      'Initial mainnet privacy notice adopted via Protocol Governance Resolution establishing immutable blockchain vs controllable off-chain boundaries.',
    operator: 'TruthBounty Protocol Governance / TruthBounty DAO',
    network: 'mainnet',
    clauses: MAINNET_PRIVACY_CLAUSES_V1,
    status: 'published',
    publishedAt: '2026-06-01T00:00:00.000Z',
    source: 'governance',
    lastReviewedAt: '2026-06-01T00:00:00.000Z',
  },
];

export const MAINNET_PRIVACY_METADATA: PrivacyMetadata = {
  currentVersion: '1.0.0',
  versions: MAINNET_PRIVACY_VERSIONS,
  lastUpdated: '2026-06-01T00:00:00.000Z',
  network: 'mainnet',
  operator: 'TruthBounty Protocol Governance / TruthBounty DAO',
};

export function getMainnetPrivacy(version?: string): PrivacyVersion {
  if (version) {
    const found = MAINNET_PRIVACY_VERSIONS.find((v) => v.version === version);
    if (found) return found;
  }
  return MAINNET_PRIVACY_VERSIONS.find(
    (v) => v.version === MAINNET_PRIVACY_METADATA.currentVersion,
  )!;
}

export function getMainnetPrivacyMetadata(): PrivacyMetadata {
  return MAINNET_PRIVACY_METADATA;
}
