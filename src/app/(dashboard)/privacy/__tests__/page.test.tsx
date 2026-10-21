import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPage, { generateMetadata } from '../page';
import { PrivacyPageClient } from '../PrivacyPageClient';
import { TESTNET_PRIVACY_VERSIONS, TESTNET_PRIVACY_METADATA } from '@/data/privacy/testnet';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('PrivacyPage server component and generateMetadata', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  it('generates metadata with version and network for testnet', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ network: 'testnet' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.title).toContain('Privacy Notice v1.0.0');
    expect(metadata.title).toContain('Testnet (Optimism Sepolia)');
    expect(metadata.description).toContain('TruthBounty Testnet (Optimism Sepolia) Privacy Notice');
  });

  it('generates metadata with version and network for mainnet', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ network: 'mainnet' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.title).toContain('Mainnet (Optimism)');
    expect(metadata.description).toContain('TruthBounty Mainnet (Optimism) Privacy Notice');
  });

  it('renders server page defaulting to testnet when no params given', async () => {
    const pageElement = await PrivacyPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });

    render(pageElement);

    expect(screen.getByRole('heading', { name: 'Privacy Notice', level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('Testnet notice')).toBeInTheDocument();
  });

  it('renders server page with specific version when requested', async () => {
    const pageElement = await PrivacyPage({
      params: Promise.resolve({ network: 'testnet' }),
      searchParams: Promise.resolve({ version: '1.0.0' }),
    });

    render(pageElement);

    expect(screen.getByText(/Version 1\.0\.0/)).toBeInTheDocument();
  });
});

describe('PrivacyPageClient', () => {
  const publishedVersions = [
    TESTNET_PRIVACY_VERSIONS[0],
    {
      ...TESTNET_PRIVACY_VERSIONS[0],
      version: '0.9.0',
      effectiveDate: '2025-11-01',
      publishedAt: '2025-11-01T00:00:00.000Z',
      status: 'published' as const,
    },
  ];

  it('renders skip link target with id main-content and role main', () => {
    const { container } = render(
      <PrivacyPageClient
        network="testnet"
        currentVersion={publishedVersions[0]}
        allVersions={publishedVersions}
      />,
    );

    const mainTarget = container.querySelector('#main-content');
    expect(mainTarget).toBeInTheDocument();
    expect(mainTarget).toHaveAttribute('role', 'main');
    expect(mainTarget).toHaveAttribute('tabIndex', '-1');
  });

  it('updates route query string when version is changed', () => {
    render(
      <PrivacyPageClient
        network="testnet"
        currentVersion={publishedVersions[0]}
        allVersions={publishedVersions}
      />,
    );

    const historicalVersion = publishedVersions[1];
    const button = screen.getByRole('button', {
      name: new RegExp(`View version ${historicalVersion.version}`, 'i'),
    });

    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining(`/privacy?version=${encodeURIComponent(historicalVersion.version)}`),
    );
  });
});
