import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacySection } from '../PrivacySection';
import type { PrivacyClause } from '@/app/types/privacy';

const approvedImmutableClause: PrivacyClause = {
  id: 'wallet-blockchain',
  title: 'Wallet & Blockchain Data',
  content: '1.1. Public wallet addresses are immutable.\n1.2. Transactions cannot be reversed.',
  status: 'approved',
  dataBoundary: 'immutable-chain',
  lastReviewedAt: '2026-01-15T00:00:00.000Z',
};

const approvedControllableClause: PrivacyClause = {
  id: 'session-support',
  title: 'Session & Support Communications',
  content: '2.1. Client storage is local.\n2.2. Inquiries are processed off-chain.',
  status: 'approved',
  dataBoundary: 'controllable-off-chain',
  lastReviewedAt: '2026-01-15T00:00:00.000Z',
};

const reviewClause: PrivacyClause = {
  id: 'logs',
  title: 'Telemetry, Performance & Incident Logs',
  content: '3.1. Telemetry is opt-in and sanitized.',
  status: 'review',
  dataBoundary: 'controllable-off-chain',
  reviewerNotes: 'Pending compliance team approval for 14-day retention cycle.',
};

const unavailableClause: PrivacyClause = {
  id: 'jurisdiction',
  title: 'Jurisdiction & Regulatory Scope',
  content: 'This clause is currently unavailable.',
  status: 'unavailable',
  dataBoundary: 'controllable-off-chain',
};

describe('PrivacySection', () => {
  it('renders section title, description, and content lines', () => {
    render(
      <PrivacySection
        clause={approvedImmutableClause}
        sectionId="wallet-blockchain"
        network="testnet"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Wallet & Blockchain Data' })).toBeInTheDocument();
    expect(screen.getByText(/Public addresses, cryptographic signatures/)).toBeInTheDocument();
    expect(screen.getByText('1.1. Public wallet addresses are immutable.')).toBeInTheDocument();
    expect(screen.getByText('1.2. Transactions cannot be reversed.')).toBeInTheDocument();
  });

  it('displays Immutable On-Chain data boundary badge and callout for on-chain data', () => {
    render(
      <PrivacySection
        clause={approvedImmutableClause}
        sectionId="wallet-blockchain"
        network="testnet"
      />,
    );

    const section = screen.getByTestId('wallet-blockchain');
    expect(within(section).getByText('Immutable On-Chain')).toBeInTheDocument();
    expect(within(section).getByText(/Immutable Ledger Record/)).toBeInTheDocument();
    expect(section).toHaveAttribute('data-boundary', 'immutable-chain');
  });

  it('displays Controllable Off-Chain data boundary badge and callout for off-chain data', () => {
    render(
      <PrivacySection
        clause={approvedControllableClause}
        sectionId="session-support"
        network="mainnet"
      />,
    );

    const section = screen.getByTestId('session-support');
    expect(within(section).getByText('Controllable Off-Chain')).toBeInTheDocument();
    expect(within(section).getByText(/Controllable Record/)).toBeInTheDocument();
    expect(section).toHaveAttribute('data-boundary', 'controllable-off-chain');
  });

  it('renders status badges correctly', () => {
    const { rerender } = render(
      <PrivacySection
        clause={approvedImmutableClause}
        sectionId="wallet-blockchain"
        network="testnet"
      />,
    );

    expect(screen.getByText('Approved')).toBeInTheDocument();

    rerender(
      <PrivacySection
        clause={reviewClause}
        sectionId="logs"
        network="testnet"
      />,
    );

    expect(screen.getByText('Under Review')).toBeInTheDocument();

    rerender(
      <PrivacySection
        clause={unavailableClause}
        sectionId="jurisdiction"
        network="testnet"
      />,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('renders reviewer notes when clause status is review', () => {
    render(
      <PrivacySection
        clause={reviewClause}
        sectionId="logs"
        network="testnet"
      />,
    );

    expect(screen.getByRole('note', { name: 'Reviewer notes' })).toBeInTheDocument();
    expect(screen.getByText(/Pending compliance team approval/)).toBeInTheDocument();
  });

  it('renders unavailable alert when clause status is unavailable', () => {
    render(
      <PrivacySection
        clause={unavailableClause}
        sectionId="jurisdiction"
        network="testnet"
      />,
    );

    expect(screen.getByRole('alert', { name: 'Clause unavailable' })).toBeInTheDocument();
    expect(screen.getByText(/This privacy clause is currently unavailable/)).toBeInTheDocument();
  });

  it('renders formatted last reviewed timestamp', () => {
    render(
      <PrivacySection
        clause={approvedImmutableClause}
        sectionId="wallet-blockchain"
        network="testnet"
      />,
    );

    expect(screen.getByText(/Last reviewed:/)).toBeInTheDocument();
  });

  it('sanitizes content and prevents script injection', () => {
    const maliciousClause: PrivacyClause = {
      id: 'processor',
      title: 'Third-Party Processors <script>alert("xss")</script>',
      content: 'Safe content <img src=x onerror=alert(1)> here.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    };

    render(
      <PrivacySection
        clause={maliciousClause}
        sectionId="processor"
        network="testnet"
      />,
    );

    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });
});
