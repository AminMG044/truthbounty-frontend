import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyVersionSelector } from '../PrivacyVersionSelector';
import type { PrivacyVersion } from '@/app/types/privacy';

const mockVersions: PrivacyVersion[] = [
  {
    version: '1.1.0',
    effectiveDate: '2026-02-01',
    materialChanges: 'Telemetry transparency updates.',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    network: 'testnet',
    clauses: [],
    status: 'published',
    publishedAt: '2026-02-01T00:00:00.000Z',
    source: 'board',
    previousVersion: '1.0.0',
  },
  {
    version: '1.0.0',
    effectiveDate: '2026-01-15',
    materialChanges: 'Initial testnet privacy notice.',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    network: 'testnet',
    clauses: [],
    status: 'published',
    publishedAt: '2026-01-15T00:00:00.000Z',
    source: 'board',
  },
  {
    version: '1.2.0-draft',
    effectiveDate: '2026-04-01',
    materialChanges: 'Proposed draft revisions for cross-border node coordination.',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    network: 'testnet',
    clauses: [],
    status: 'draft',
    source: 'board',
    previousVersion: '1.1.0',
  },
];

describe('PrivacyVersionSelector', () => {
  const onVersionChange = jest.fn();

  beforeEach(() => {
    onVersionChange.mockClear();
  });

  it('renders active current version card with operator', () => {
    render(
      <PrivacyVersionSelector
        versions={mockVersions}
        currentVersion="1.1.0"
        network="testnet"
        onVersionChange={onVersionChange}
        operator="TruthBounty Foundation (Testnet Operator)"
      />,
    );

    expect(screen.getByText('Active Privacy Version')).toBeInTheDocument();
    expect(screen.getAllByText('1.1.0')[0]).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText(/TruthBounty Foundation \(Testnet Operator\)/)[0]).toBeInTheDocument();
  });

  it('renders published versions and highlights current version', () => {
    render(
      <PrivacyVersionSelector
        versions={mockVersions}
        currentVersion="1.1.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.getByText('Published Versions')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('triggers onVersionChange when user selects another published version', () => {
    render(
      <PrivacyVersionSelector
        versions={mockVersions}
        currentVersion="1.1.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const viewButton = screen.getByRole('button', { name: /View version 1\.0\.0/i });
    fireEvent.click(viewButton);

    expect(onVersionChange).toHaveBeenCalledTimes(1);
    expect(onVersionChange).toHaveBeenCalledWith('1.0.0');
  });

  it('displays draft versions with non-publication warning', () => {
    render(
      <PrivacyVersionSelector
        versions={mockVersions}
        currentVersion="1.1.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    expect(screen.getByText('Draft Versions (Not Published)')).toBeInTheDocument();
    expect(screen.getByText('1.2.0-draft')).toBeInTheDocument();
    expect(screen.getByText(/Draft content cannot be published as approved/)).toBeInTheDocument();
  });

  it('shows material changes details', () => {
    render(
      <PrivacyVersionSelector
        versions={mockVersions}
        currentVersion="1.1.0"
        network="testnet"
        onVersionChange={onVersionChange}
      />,
    );

    const summaries = screen.getAllByText('Material Changes');
    fireEvent.click(summaries[0]);

    expect(screen.getByText('Telemetry transparency updates.')).toBeInTheDocument();
  });
});
