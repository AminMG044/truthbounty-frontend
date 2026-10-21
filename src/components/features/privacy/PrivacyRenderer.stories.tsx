import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within, userEvent } from '@storybook/test';
import { PrivacyRenderer } from './PrivacyRenderer';
import type { PrivacyVersion } from '@/app/types/privacy';
import { TESTNET_PRIVACY_VERSIONS } from '@/data/privacy/testnet';
import { MAINNET_PRIVACY_VERSIONS } from '@/data/privacy/mainnet';

const testnetVersion = TESTNET_PRIVACY_VERSIONS[0];
const testnetDraftVersion = TESTNET_PRIVACY_VERSIONS[1];
const mainnetVersion = MAINNET_PRIVACY_VERSIONS[0];

const reviewVersion: PrivacyVersion = {
  ...testnetVersion,
  version: '1.2.0-review',
  materialChanges: 'Review version containing proposed revisions under legal evaluation.',
  clauses: testnetVersion.clauses.map((clause) =>
    clause.id === 'logs' || clause.id === 'processor'
      ? {
          ...clause,
          status: 'review' as const,
          reviewerNotes: 'Pending protocol security audit and compliance assessment before publication.',
        }
      : clause,
  ),
};

const unavailableVersion: PrivacyVersion = {
  ...testnetVersion,
  version: '1.3.0-incomplete',
  materialChanges: 'Simulating missing clause to verify synthetic unavailable fail-closed fallback.',
  clauses: testnetVersion.clauses.filter((clause) => clause.id !== 'request'),
};

const meta: Meta<typeof PrivacyRenderer> = {
  title: 'Features/Privacy/PrivacyRenderer',
  component: PrivacyRenderer,
  parameters: {
    layout: 'padded',
  },
  args: {
    onVersionChange: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof PrivacyRenderer>;

export const Default: Story = {
  args: {
    version: testnetVersion,
    allVersions: TESTNET_PRIVACY_VERSIONS,
    network: 'testnet',
  },
};

export const Mainnet: Story = {
  args: {
    version: mainnetVersion,
    allVersions: MAINNET_PRIVACY_VERSIONS,
    network: 'mainnet',
  },
};

export const WithReviewClauses: Story = {
  args: {
    version: reviewVersion,
    allVersions: [reviewVersion, testnetVersion],
    network: 'testnet',
  },
};

export const WithUnavailableClauses: Story = {
  args: {
    version: unavailableVersion,
    allVersions: [unavailableVersion, testnetVersion],
    network: 'testnet',
  },
};

export const DraftVersion: Story = {
  args: {
    version: testnetDraftVersion,
    allVersions: TESTNET_PRIVACY_VERSIONS,
    network: 'testnet',
  },
};

export const InteractiveExpansionAndCollapse: Story = {
  args: {
    version: testnetVersion,
    allVersions: TESTNET_PRIVACY_VERSIONS,
    network: 'testnet',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify main display heading
    const heading = canvas.getByRole('heading', { level: 1, name: /Privacy Notice/i });
    await expect(heading).toBeInTheDocument();

    // Verify data boundary legend is present
    const boundaryLegend = canvas.getByLabelText('data boundary explanation', { exact: false });
    await expect(boundaryLegend).toBeInTheDocument();

    // Test Collapse All
    const collapseButton = canvas.getByRole('button', { name: /Collapse All/i });
    await userEvent.click(collapseButton);

    // Verify first section accordion toggle button has aria-expanded=false
    const walletSectionButton = canvas.getByRole('button', { name: /Wallet & Blockchain Data/i });
    await expect(walletSectionButton).toHaveAttribute('aria-expanded', 'false');

    // Expand single section
    await userEvent.click(walletSectionButton);
    await expect(walletSectionButton).toHaveAttribute('aria-expanded', 'true');

    // Test Expand All
    const expandAllButton = canvas.getByRole('button', { name: /Expand All/i });
    await userEvent.click(expandAllButton);
    await expect(walletSectionButton).toHaveAttribute('aria-expanded', 'true');
  },
};
