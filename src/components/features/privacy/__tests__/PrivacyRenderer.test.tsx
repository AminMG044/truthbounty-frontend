import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyRenderer } from '../PrivacyRenderer';
import type { PrivacyVersion } from '@/app/types/privacy';
import { PRIVACY_SECTIONS, PRIVACY_SECTION_TITLES } from '@/app/types/privacy';

const mockVersion: PrivacyVersion = {
  version: '1.0.0',
  effectiveDate: '2026-01-15',
  materialChanges: 'Initial testnet privacy notice publication.',
  operator: 'TruthBounty Foundation (Testnet Operator)',
  network: 'testnet',
  clauses: [
    {
      id: 'wallet-blockchain',
      title: 'Wallet & Blockchain Data',
      content: '1.1. Public wallet addresses are immutable.\n1.2. Transactions cannot be reversed.',
      status: 'approved',
      dataBoundary: 'immutable-chain',
      lastReviewedAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'session-support',
      title: 'Session & Support Communications',
      content: '2.1. Client storage is local.\n2.2. Support inquiries can be expunged.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
      lastReviewedAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'logs',
      title: 'Telemetry, Performance & Incident Logs',
      content: '3.1. Telemetry is opt-in and sanitized.',
      status: 'review',
      dataBoundary: 'controllable-off-chain',
      reviewerNotes: 'Pending final review of retention window.',
    },
    {
      id: 'evidence-public-source',
      title: 'Evidence & Public Sources',
      content: '4.1. IPFS CIDs are public and permanent.',
      status: 'approved',
      dataBoundary: 'immutable-chain',
    },
    {
      id: 'processor',
      title: 'Third-Party Processors & Infrastructure',
      content: '5.1. RPC providers process network transactions.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    },
    {
      id: 'retention',
      title: 'Data Retention & Finality Schedule',
      content: '6.1. Blockchain records persist indefinitely. Logs expire in 30 days.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    },
    {
      id: 'request',
      title: 'User Rights & Subject Requests',
      content: '7.1. Off-chain data may be erased upon verified request.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    },
    {
      id: 'jurisdiction',
      title: 'Jurisdiction & Regulatory Scope',
      content: '8.1. Cayman Islands legal framework applies.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    },
    {
      id: 'revision',
      title: 'Revision History & Amendments',
      content: '9.1. Version updates require board review.',
      status: 'approved',
      dataBoundary: 'controllable-off-chain',
    },
  ],
  status: 'published',
  publishedAt: '2026-01-15T00:00:00.000Z',
  source: 'board',
};

const mockAllVersions: PrivacyVersion[] = [
  mockVersion,
  {
    ...mockVersion,
    version: '0.9.0',
    effectiveDate: '2025-12-01',
    materialChanges: 'Draft pre-release version.',
    status: 'draft',
    publishedAt: undefined,
    source: 'board',
  },
];

describe('PrivacyRenderer', () => {
  const onVersionChange = jest.fn();

  beforeEach(() => {
    onVersionChange.mockClear();
  });

  it('renders privacy header with version, operator, network, and status', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Privacy Notice', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Version 1\.0\.0/)).toBeInTheDocument();

    const headers = screen.getAllByRole('banner');
    expect(within(headers[0]).getByText(/TruthBounty Foundation \(Testnet Operator\)/)).toBeInTheDocument();
    expect(within(headers[0]).getByText('Testnet')).toBeInTheDocument();
    expect(within(headers[0]).getByText('Board')).toBeInTheDocument();
    expect(within(headers[0]).getByText('Published')).toBeInTheDocument();
  });

  it('renders data boundary legend distinguishing immutable on-chain vs controllable off-chain data', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.getByText('Data Architecture & Boundary Classification')).toBeInTheDocument();
    expect(screen.getByText('Public & Permanent')).toBeInTheDocument();
    expect(screen.getByText('Expungeable & Managed')).toBeInTheDocument();
  });

  it('renders material changes in details accordion', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const summary = screen.getByText('Material Changes in This Version');
    fireEvent.click(summary);

    const details = summary.closest('details');
    expect(within(details!).getByText('Initial testnet privacy notice publication.')).toBeInTheDocument();
  });

  it('renders review summary when clauses have non-approved status', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const reviewSummary = screen.getByRole('region', { name: 'Privacy review summary' });
    expect(within(reviewSummary).getByText('Clause Approval Summary')).toBeInTheDocument();
    expect(within(reviewSummary).getByText('Under Review')).toBeInTheDocument();
  });

  it('does not render review summary when all clauses are approved', () => {
    const allApprovedVersion: PrivacyVersion = {
      ...mockVersion,
      clauses: mockVersion.clauses.map((c) => ({ ...c, status: 'approved' as const })),
    };

    render(
      <PrivacyRenderer
        version={allApprovedVersion}
        allVersions={[allApprovedVersion]}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.queryByRole('region', { name: 'Privacy review summary' })).not.toBeInTheDocument();
  });

  it('renders all 9 scoped privacy sections', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    PRIVACY_SECTIONS.forEach((sectionId) => {
      const title = PRIVACY_SECTION_TITLES[sectionId];
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    });
  });

  it('handles missing sections with a synthetic fail-closed unavailable state', () => {
    const incompleteVersion: PrivacyVersion = {
      ...mockVersion,
      clauses: mockVersion.clauses.filter((c) => c.id !== 'jurisdiction'),
    };

    render(
      <PrivacyRenderer
        version={incompleteVersion}
        allVersions={[incompleteVersion]}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.getByRole('heading', { name: PRIVACY_SECTION_TITLES['jurisdiction'] })).toBeInTheDocument();
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);
  });

  it('toggles section accordion expansion', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const button = screen.getByRole('button', { name: /Wallet & Blockchain Data/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Click to expand again
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports Collapse All and Expand All controls', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const collapseAllBtn = screen.getByRole('button', { name: 'Collapse All' });
    fireEvent.click(collapseAllBtn);

    const buttons = screen.getAllByRole('button', { name: /Wallet & Blockchain Data/i });
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');

    const expandAllBtn = screen.getByRole('button', { name: 'Expand All' });
    fireEvent.click(expandAllBtn);

    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders version history and triggers onVersionChange', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const versionHistory = screen.getByRole('region', { name: 'Privacy version selector' });
    expect(within(versionHistory).getByText('Active Privacy Version')).toBeInTheDocument();
    expect(within(versionHistory).getByText('Draft Versions (Not Published)')).toBeInTheDocument();
  });

  it('renders footer disclaimer with operator and network information', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/TruthBounty Foundation/)).toBeInTheDocument();
    expect(within(footer).getByText(/Optimism Sepolia/)).toBeInTheDocument();
  });
});
