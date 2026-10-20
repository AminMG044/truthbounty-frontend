import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within, userEvent } from '@storybook/test';
import { PrivacyVersionSelector } from './PrivacyVersionSelector';
import { TESTNET_PRIVACY_VERSIONS } from '@/data/privacy/testnet';
import { MAINNET_PRIVACY_VERSIONS } from '@/data/privacy/mainnet';

const meta: Meta<typeof PrivacyVersionSelector> = {
  title: 'Features/Privacy/PrivacyVersionSelector',
  component: PrivacyVersionSelector,
  parameters: {
    layout: 'padded',
  },
  args: {
    versions: TESTNET_PRIVACY_VERSIONS,
    currentVersion: '1.0.0',
    network: 'testnet',
    operator: 'TruthBounty Foundation (Testnet Operator)',
    onVersionChange: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof PrivacyVersionSelector>;

export const Default: Story = {
  args: {
    versions: TESTNET_PRIVACY_VERSIONS,
    currentVersion: '1.0.0',
    network: 'testnet',
  },
};

export const Mainnet: Story = {
  args: {
    versions: MAINNET_PRIVACY_VERSIONS,
    currentVersion: '1.0.0',
    network: 'mainnet',
    operator: 'TruthBounty Protocol Governance / TruthBounty DAO',
  },
};

export const WithDraftVersions: Story = {
  args: {
    versions: TESTNET_PRIVACY_VERSIONS,
    currentVersion: '1.0.0',
    network: 'testnet',
  },
};

export const InteractiveVersionSelection: Story = {
  args: {
    versions: [
      TESTNET_PRIVACY_VERSIONS[0],
      {
        ...TESTNET_PRIVACY_VERSIONS[0],
        version: '0.9.0',
        effectiveDate: '2025-11-01',
        materialChanges: 'Archived initial development notice.',
        previousVersion: undefined,
      },
    ],
    currentVersion: '1.0.0',
    network: 'testnet',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify current version is marked Active
    const activeBadge = canvas.getByText('Active');
    await expect(activeBadge).toBeInTheDocument();

    // Verify view version button exists for historical version
    const viewButton = canvas.getByRole('button', { name: /View version 0\.9\.0/i });
    await expect(viewButton).toBeInTheDocument();

    // Click view version
    await userEvent.click(viewButton);
  },
};
