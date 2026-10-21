import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PrivacySection } from './PrivacySection';
import type { PrivacyClause } from '@/app/types/privacy';

const approvedImmutableClause: PrivacyClause = {
  id: 'wallet-blockchain',
  title: 'Wallet & Blockchain Data',
  content: `1.1. Public Ledger Transparency: TruthBounty interactions take place on the Optimism network. When you connect your wallet and execute transactions, your public address, transaction hash, and parameters are broadcast to decentralized node operators and recorded permanently.
1.2. Immutability of On-Chain Records: Due to the append-only architecture of Ethereum and Optimism Layer 2, transactions cannot be altered, rolled back, or erased by the interface operator.`,
  status: 'approved',
  dataBoundary: 'immutable-chain',
  lastReviewedAt: '2026-01-15T00:00:00.000Z',
};

const approvedControllableClause: PrivacyClause = {
  id: 'session-support',
  title: 'Session & Support Communications',
  content: `2.1. Client-Side Session State: The interface maintains minimal operational state locally in your browser. This information resides on your local device.
2.2. Voluntary Inquiries: Support ticket communications are processed off-chain and expunged in accordance with our retention policy.`,
  status: 'approved',
  dataBoundary: 'controllable-off-chain',
  lastReviewedAt: '2026-01-15T00:00:00.000Z',
};

const reviewClause: PrivacyClause = {
  id: 'logs',
  title: 'Telemetry, Performance & Incident Logs',
  content: `3.1. Opt-in privacy-safe telemetry proposal with shortened 14-day retention cycle.`,
  status: 'review',
  dataBoundary: 'controllable-off-chain',
  reviewerNotes: 'Pending legal assessment on multi-region telemetry aggregation compliance.',
  lastReviewedAt: '2026-02-01T00:00:00.000Z',
};

const unavailableClause: PrivacyClause = {
  id: 'jurisdiction',
  title: 'Jurisdiction & Regulatory Scope',
  content: 'This clause is currently unavailable pending regulatory review.',
  status: 'unavailable',
  dataBoundary: 'controllable-off-chain',
};

const meta: Meta<typeof PrivacySection> = {
  title: 'Features/Privacy/PrivacySection',
  component: PrivacySection,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PrivacySection>;

export const ApprovedImmutableChain: Story = {
  args: {
    clause: approvedImmutableClause,
    sectionId: 'wallet-blockchain',
    network: 'testnet',
  },
};

export const ApprovedControllableOffChain: Story = {
  args: {
    clause: approvedControllableClause,
    sectionId: 'session-support',
    network: 'mainnet',
  },
};

export const UnderReviewWithNotes: Story = {
  args: {
    clause: reviewClause,
    sectionId: 'logs',
    network: 'testnet',
  },
};

export const Unavailable: Story = {
  args: {
    clause: unavailableClause,
    sectionId: 'jurisdiction',
    network: 'testnet',
  },
};
