import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import {
  ClaimStatementStep,
  EMPTY_CLAIM_STATEMENT,
  validateClaimStatement,
  type ClaimStatementDraft,
} from './ClaimStatementForm';

interface StoryHarnessProps {
  recovery?: boolean;
  configurationAvailable?: boolean;
}

function StoryHarness({ recovery = false, configurationAvailable = true }: StoryHarnessProps) {
  const [data, setData] = useState<ClaimStatementDraft>(EMPTY_CLAIM_STATEMENT);
  const [showErrors, setShowErrors] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(recovery);
  const [status, setStatus] = useState<'clean' | 'saved-local' | 'dirty'>('clean');
  const errors = validateClaimStatement(data);
  const recovered: ClaimStatementDraft = {
    title: 'Unsafe chemical discharge',
    category: 'Environment',
    geographicScope: 'North district',
    verificationContext: 'Compare the public test results with the dated inspection report.',
  };

  return (
    <ClaimStatementStep
      data={data}
      errors={errors}
      showErrors={showErrors}
      onChange={(field, value) => {
        setData((current) => ({ ...current, [field]: value }));
        setStatus('dirty');
      }}
      onBlur={() => undefined}
      onValidate={() => setShowErrors(true)}
      onSave={() => setStatus('saved-local')}
      onRestore={() => {
        setData(recovered);
        setHasRecovery(false);
      }}
      onDiscard={() => {
        setData(EMPTY_CLAIM_STATEMENT);
        setStatus('clean');
      }}
      onDiscardStale={() => undefined}
      hasRestoredDraft={hasRecovery}
      restoredPayload={hasRecovery ? recovered : null}
      status={status}
      quarantinedReason={null}
      configurationAvailable={configurationAvailable}
    />
  );
}

const meta = {
  title: 'Claim Submission/Claim Statement',
  component: StoryHarness,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StoryHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const ValidationSummary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Review statement' }));
    await expect(canvas.getByRole('alert', { name: 'Review these fields' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
  },
};

export const DraftRecovery: Story = {
  args: { recovery: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Restore saved statement' }));
    await expect(canvas.getByLabelText('Title')).toHaveValue('Unsafe chemical discharge');
  },
};

export const UnavailableConfiguration: Story = {
  args: { configurationAvailable: false },
};