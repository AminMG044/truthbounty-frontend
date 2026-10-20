import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PrivacySection } from '../PrivacySection';
import { PrivacyVersionSelector } from '../PrivacyVersionSelector';
import { PrivacyReviewState, PrivacyReviewSummary } from '../PrivacyReviewState';
import { PrivacyDataBoundaryLegend } from '../PrivacyDataBoundaryLegend';
import { PrivacyRenderer } from '../PrivacyRenderer';
import type { PrivacyVersion, PrivacyClause } from '@/app/types/privacy';

expect.extend(toHaveNoViolations);

const mockClause: PrivacyClause = {
  id: 'wallet-blockchain',
  title: 'Wallet & Blockchain Data',
  content: '1.1. Public wallet addresses are immutable.\n1.2. Transactions cannot be reversed.',
  status: 'approved',
  dataBoundary: 'immutable-chain',
  lastReviewedAt: '2026-01-15T00:00:00.000Z',
};

const mockVersion: PrivacyVersion = {
  version: '1.0.0',
  effectiveDate: '2026-01-15',
  materialChanges: 'Initial testnet privacy notice publication.',
  operator: 'TruthBounty Foundation (Testnet Operator)',
  network: 'testnet',
  clauses: [
    mockClause,
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
    materialChanges: 'Draft pre-release notice.',
    status: 'draft',
    publishedAt: undefined,
    source: 'board',
  },
];

describe('PrivacySection accessibility', () => {
  it('has no accessibility violations for approved immutable clause', async () => {
    const { container } = render(
      <PrivacySection clause={mockClause} sectionId="wallet-blockchain" network="testnet" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations for review clause', async () => {
    const reviewClause: PrivacyClause = {
      ...mockClause,
      id: 'logs',
      title: 'Telemetry, Performance & Incident Logs',
      status: 'review',
      dataBoundary: 'controllable-off-chain',
      reviewerNotes: 'Pending legal sign-off',
    };
    const { container } = render(
      <PrivacySection clause={reviewClause} sectionId="logs" network="mainnet" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations for unavailable clause', async () => {
    const unavailableClause: PrivacyClause = {
      ...mockClause,
      status: 'unavailable',
    };
    const { container } = render(
      <PrivacySection clause={unavailableClause} sectionId="jurisdiction" network="testnet" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper heading hierarchy with id attribute', () => {
    const { container } = render(
      <PrivacySection clause={mockClause} sectionId="wallet-blockchain" network="testnet" />,
    );
    const heading = container.querySelector('h2');
    expect(heading).toHaveAttribute('id', 'wallet-blockchain-title');
  });

  it('has ARIA labels for status badges and data boundary badges', () => {
    const { container } = render(
      <PrivacySection clause={mockClause} sectionId="wallet-blockchain" network="testnet" />,
    );
    expect(
      container.querySelector('[aria-label="This clause has been approved and is legally effective"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[aria-label="Data Boundary: Immutable On-Chain"]'),
    ).toBeInTheDocument();
  });
});

describe('PrivacyDataBoundaryLegend accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<PrivacyDataBoundaryLegend />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has aria-labelledby pointing to data boundary heading', () => {
    const { container } = render(<PrivacyDataBoundaryLegend />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-labelledby', 'data-boundary-heading');
  });
});

describe('PrivacyVersionSelector accessibility', () => {
  const onVersionChange = jest.fn();

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PrivacyVersionSelector
        versions={mockAllVersions}
        currentVersion="1.0.0"
        network="testnet"
        onVersionChange={onVersionChange}
        operator="TruthBounty Foundation (Testnet Operator)"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has region with ARIA label', () => {
    const { container } = render(
      <PrivacyVersionSelector
        versions={mockAllVersions}
        currentVersion="1.0.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    expect(container.querySelector('[aria-label="Privacy version selector"]')).toBeInTheDocument();
  });

  it('buttons have accessible names', () => {
    const versionsWithHistorical = [
      mockVersion,
      {
        ...mockVersion,
        version: '0.8.0',
        effectiveDate: '2025-10-01',
        materialChanges: 'Historical published version.',
        status: 'published' as const,
      },
    ];

    render(
      <PrivacyVersionSelector
        versions={versionsWithHistorical}
        currentVersion="1.0.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const button = screen.getByRole('button', { name: /view version 0\.8\.0/i });
    expect(button).toBeInTheDocument();
  });
});

describe('PrivacyReviewState accessibility', () => {
  it('has no accessibility violations for review status', async () => {
    const { container } = render(
      <PrivacyReviewState
        status="review"
        reviewerNotes="Review notes here"
        clauseTitle="Telemetry & Logs"
        network="mainnet"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations for unavailable status', async () => {
    const { container } = render(
      <PrivacyReviewState
        status="unavailable"
        clauseTitle="Jurisdiction"
        network="testnet"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('uses role="note" for review status and role="alert" for unavailable', () => {
    const { container: reviewContainer } = render(
      <PrivacyReviewState
        status="review"
        clauseTitle="Logs"
        network="mainnet"
      />,
    );
    expect(reviewContainer.querySelector('[role="note"]')).toBeInTheDocument();

    const { container: alertContainer } = render(
      <PrivacyReviewState
        status="unavailable"
        clauseTitle="Jurisdiction"
        network="testnet"
      />,
    );
    expect(alertContainer.querySelector('[role="alert"]')).toBeInTheDocument();
  });
});

describe('PrivacyReviewSummary accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <PrivacyReviewSummary
        clauses={[
          { id: 'wallet', title: 'Wallet', status: 'approved' },
          { id: 'logs', title: 'Logs', status: 'review' },
        ]}
        network="mainnet"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has region with ARIA label', () => {
    const { container } = render(
      <PrivacyReviewSummary
        clauses={[{ id: 'logs', title: 'Logs', status: 'review' }]}
        network="mainnet"
      />,
    );
    expect(container.querySelector('[role="region"][aria-label="Privacy review summary"]')).toBeInTheDocument();
  });
});

describe('PrivacyRenderer accessibility', () => {
  const onVersionChange = jest.fn();

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has banner landmark', () => {
    const { container } = render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
  });

  it('has contentinfo landmark', () => {
    const { container } = render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    expect(container.querySelector('[role="contentinfo"]')).toBeInTheDocument();
  });

  it('has proper heading hierarchy with single h1', () => {
    const { container } = render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent('Privacy Notice');

    const h2s = container.querySelectorAll('h2');
    expect(h2s.length).toBeGreaterThan(0);
  });

  it('expandable sections have proper ARIA attributes', () => {
    const { container } = render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    const buttons = container.querySelectorAll('button[aria-expanded]');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-controls');
    });
  });

  it('version history section has region label', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    expect(screen.getByRole('region', { name: 'Version History' })).toBeInTheDocument();
  });

  it('expand/collapse controls are accessible', () => {
    render(
      <PrivacyRenderer
        version={mockVersion}
        allVersions={mockAllVersions}
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument();
  });
});
