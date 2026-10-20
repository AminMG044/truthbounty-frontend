/**
 * Privacy Notice — Testnet Configuration
 *
 * Testnet privacy terms are distinct from mainnet privacy terms.
 * Draft content is NEVER published as approved (fail-closed).
 * Testnet operates on Optimism Sepolia (Chain ID: 11155420).
 * Clearly distinguishes immutable blockchain records from controllable off-chain data.
 */

import type { PrivacyVersion, PrivacyMetadata, PrivacyClause } from '@/app/types/privacy';

export const TESTNET_PRIVACY_CLAUSES_V1: PrivacyClause[] = [
  {
    id: 'wallet-blockchain',
    title: 'Wallet & Blockchain Data',
    content: `1.1. Public Ledger Transparency: TruthBounty testnet interactions take place on the Optimism Sepolia testnet. When you connect your wallet and execute transactions (e.g., submitting test claims, staking testnet tokens, or casting verification votes), your public wallet address, transaction hash, contract call parameters, and timestamps are broadcast to decentralized node operators and recorded permanently on the blockchain.

1.2. Immutability of On-Chain Records: Due to the decentralized and append-only architecture of Ethereum and Optimism Layer 2, transactions and state transitions cannot be altered, rolled back, or erased by the TruthBounty interface operator. Your public address and signed actions constitute permanent public protocol records.

1.3. Pseudonymity & De-Anonymization Risk: While blockchain addresses do not inherently contain legal names or direct contact information, on-chain activity is publicly queryable. Connecting a public address linked to your real identity or social profiles may allow third parties to associate your protocol activity with you.

1.4. Key Management: The TruthBounty interface does not custody, collect, or store private keys, seed phrases, or wallet passwords. All cryptographic signing occurs locally within your connected wallet client.`,
    status: 'approved',
    dataBoundary: 'immutable-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'session-support',
    title: 'Session & Support Communications',
    content: `2.1. Client-Side Session State: The interface maintains temporary session state within your browser's local storage (e.g., active network preference, connection status, unsubmitted draft claims, UI display settings). This information resides exclusively on your local device and is never transmitted to a centralized tracking database without explicit user initiation.

2.2. Voluntary Inquiries & Support Messages: If you submit an inquiry through official support channels or feedback portals, we process only the email address, category, and message description you provide.

2.3. Prohibited Submissions: You must not submit private keys, seed phrases, sensitive personal financial data, or passwords in support requests. The interface implements automatic sanitization patterns to intercept and redact accidental credential submissions before transmission.

2.4. Controllable Processing: Support records are stored in managed off-chain databases with strict access control and are expunged in accordance with our retention policy or upon verified request.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'logs',
    title: 'Telemetry, Performance & Incident Logs',
    content: `3.1. Opt-In Privacy-Safe Telemetry: Telemetry collection is disabled by default and requires explicit user consent via the PRIVACY_SAFE_TELEMETRY configuration flag. No tracking cookies or fingerprinting mechanisms are used for cross-site behavioral advertising.

3.2. Data Sanitization & Secret Scrubbing: When telemetry is enabled, payloads are strictly scrubbed to prevent transmission of private keys, hex signatures, authorization headers, full wallet balances, or unredacted evidence URLs. Only sanitized error codes, route names, component stack traces, and anonymized performance timings are gathered.

3.3. Incident Diagnostics: Operational incident reports and error boundaries capture system health anomalies to maintain frontend stability. Diagnostic logs are dissociated from user identities and automatically aged out.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'evidence-public-source',
    title: 'Evidence & Public Sources',
    content: `4.1. Public Content Submission: Supporting evidence submitted during claim creation (such as public web URLs, IPFS content identifiers (CIDs), and cryptographic hashes) is designed to be accessible to verifiers, disputants, and public observers.

4.2. IPFS Storage & Decentralized Availability: Content pinned to the InterPlanetary File System (IPFS) is distributed across peer nodes. Once published, IPFS CIDs and content cannot be unilaterally deleted or withdrawn by the interface operator.

4.3. Client-Side Truncation & Privacy Sanitization: For frontend presentation, evidence metadata is formatted with privacy-preserving truncations to prevent accidental exposure of embedded identifiers. Users should never submit confidential, proprietary, or personal data as public claim evidence.`,
    status: 'approved',
    dataBoundary: 'immutable-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'processor',
    title: 'Third-Party Processors & Infrastructure',
    content: `5.1. Decentralized RPC Infrastructure: The TruthBounty interface connects to RPC nodes (including Optimism Sepolia endpoints, Alchemy, or Infura) to query contract states and broadcast signed transactions. RPC providers may log client IP addresses and standard HTTP request headers in accordance with their independent privacy policies.

5.2. IPFS Gateways: Evidence retrieval utilizes public or dedicated IPFS gateways. Gateway providers may temporarily log gateway traffic and content requests for caching and security purposes.

5.3. Identity Verification Partners: Where optional zero-knowledge identity or sybil-resistance mechanisms (such as World ID) are evaluated on testnet, verification utilizes zero-knowledge nullifiers. No biometric iris scans or personal government identity credentials are ever transmitted to or stored by TruthBounty.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'retention',
    title: 'Data Retention & Finality Schedule',
    content: `6.1. Blockchain Retention: On-chain transaction records, claim attestations, and cryptographic evidence hashes persist indefinitely as part of the immutable Optimism Sepolia blockchain history.

6.2. Off-Chain Retention:
   - Sanitized telemetry logs: Retained for a maximum of 30 days, then permanently deleted.
   - Support communications: Retained for up to 90 days following inquiry resolution to address follow-ups, then purged.
   - Local browser storage: Retained on your device until cleared manually by the user or through browser cache eviction.

6.3. Testnet Resets: As a testnet environment, off-chain caches and indexer projections may be cleared, migrated, or reset at any time during protocol upgrades.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'request',
    title: 'User Rights & Subject Requests',
    content: `7.1. Controllable Data Subject Rights: You have the right to request access to, rectification of, or deletion of personal data processed in our controllable off-chain systems (such as support ticket records and voluntary feedback).

7.2. Technical Impossibility on Public Blockchains: Please note that the "right to erasure" (right to be forgotten) and "right to rectification" under GDPR, CCPA, or similar regulations CANNOT be executed against data published to the public blockchain or distributed IPFS network. Once transactions or evidence hashes are confirmed on-chain, mathematical consensus prevents the operator from deleting or altering them.

7.3. Submitting Requests: Data subject requests regarding off-chain records may be submitted through official project governance or support channels. Requests will be authenticated to ensure the requester controls the relevant address or communication channel.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'jurisdiction',
    title: 'Jurisdiction & Regulatory Scope',
    content: `8.1. Governing Framework: This testnet notice is provided for developer experimentation and community testing on the Optimism Sepolia testnet. Testnet activities do not involve real-world currency or financial investments.

8.2. International Scope: The interface is hosted globally on distributed infrastructure. By accessing the interface, you acknowledge that information processed off-chain may be transferred to and processed in jurisdictions with differing data protection standards.

8.3. Supervisory Guidance: Questions regarding privacy practices may be directed to protocol governance for evaluation by legal working groups.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'revision',
    title: 'Revision History & Amendments',
    content: `9.1. Versioning Protocol: Revisions to this Privacy Notice are assigned semantic version numbers and documented with effective dates and material change summaries.

9.2. Approval Requirement: Draft versions of this notice are published in review state for transparency and community feedback. Only versions reviewed and approved by the project board or governance are marked "published" and considered active.

9.3. Prior Versions: Historical versions of this notice remain archived and accessible through the version selector for comparative analysis and regulatory traceability.`,
    status: 'approved',
    dataBoundary: 'controllable-off-chain',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
];

export const TESTNET_PRIVACY_VERSIONS: PrivacyVersion[] = [
  {
    version: '1.0.0',
    effectiveDate: '2026-01-15',
    materialChanges:
      'Initial testnet privacy notice establishing immutable blockchain vs controllable off-chain data boundaries.',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    network: 'testnet',
    clauses: TESTNET_PRIVACY_CLAUSES_V1,
    status: 'published',
    publishedAt: '2026-01-15T00:00:00.000Z',
    source: 'board',
    lastReviewedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    version: '1.1.0-draft',
    effectiveDate: '2026-03-01',
    materialChanges:
      'Proposed draft updates refining off-chain telemetry retention windows and cross-border node coordination.',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    previousVersion: '1.0.0',
    network: 'testnet',
    clauses: [
      ...TESTNET_PRIVACY_CLAUSES_V1.slice(0, 2),
      {
        ...TESTNET_PRIVACY_CLAUSES_V1[2],
        status: 'review',
        reviewerNotes:
          'Pending legal working group sign-off on 14-day telemetry retention window proposal.',
      },
      ...TESTNET_PRIVACY_CLAUSES_V1.slice(3, 7),
      {
        ...TESTNET_PRIVACY_CLAUSES_V1[7],
        status: 'review',
        reviewerNotes:
          'Clarifying multi-region data transfer compliance under updated EU-US data privacy frameworks.',
      },
      TESTNET_PRIVACY_CLAUSES_V1[8],
    ],
    status: 'draft',
    source: 'board',
    lastReviewedAt: '2026-02-20T00:00:00.000Z',
  },
];

export const TESTNET_PRIVACY_METADATA: PrivacyMetadata = {
  currentVersion: '1.0.0',
  versions: TESTNET_PRIVACY_VERSIONS,
  lastUpdated: '2026-01-15T00:00:00.000Z',
  network: 'testnet',
  operator: 'TruthBounty Foundation (Testnet Operator)',
};

export function getTestnetPrivacy(version?: string): PrivacyVersion {
  if (version) {
    const found = TESTNET_PRIVACY_VERSIONS.find((v) => v.version === version);
    if (found) return found;
  }
  return TESTNET_PRIVACY_VERSIONS.find(
    (v) => v.version === TESTNET_PRIVACY_METADATA.currentVersion,
  )!;
}

export function getTestnetPrivacyMetadata(): PrivacyMetadata {
  return TESTNET_PRIVACY_METADATA;
}
