import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Sidebar from '../Sidebar';
import { trackPendingTransaction } from '@/lib/pending-transactions';
import { AppShellProvider } from '@/context/AppShellContext';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

jest.mock('@/components/features/claim-submission', () => ({
  ClaimSubmissionForm: () => <div data-testid="claim-form" />,
}));

jest.mock('@/components/providers', () => ({
  useFeatureFlags: () => ({
    isEnabled: () => true,
  }),
}));

describe('Sidebar', () => {
  const renderSidebar = () => render(
    <AppShellProvider overrideIsConnected={false}>
      <Sidebar />
    </AppShellProvider>,
  );

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders a report bug link to the GitHub issue chooser', () => {
    renderSidebar();
    const link = screen.getByRole('link', { name: /report bug/i });
    expect(link).toHaveAttribute('href', 'https://github.com/DigiNodes/truthbounty-frontend/issues/new/choose');
  });

  it('shows pending transactions in the sidebar status area', () => {
    trackPendingTransaction({
      id: 'verification:claim-1:verify',
      kind: 'verification',
      title: 'Verification stake pending',
      description: 'Claim claim-1 is waiting for wallet confirmation.',
      txHash: null,
      chainId: null,
      machineState: 'preparing',
    });

    renderSidebar();
    expect(screen.getByTestId('sidebar-pending-transactions')).toHaveTextContent(/verification stake pending/i);
    expect(screen.getByText(/waiting for wallet confirmation/i)).toBeInTheDocument();
  });

  it('keeps the closed mobile navigation hidden and restores focus after Escape', () => {
    renderSidebar();
    const trigger = screen.getByRole('button', { name: 'Toggle navigation menu' });
    const navigation = screen.getByLabelText('Sidebar navigation');
    expect(navigation).toHaveClass('invisible');

    trigger.focus();
    fireEvent.click(trigger);
    expect(navigation).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('link', { name: 'Claims Feed' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(navigation).toHaveClass('invisible');
    expect(trigger).toHaveFocus();
  });

  it('routes Submit Claim to the canonical claim creation page', () => {
    renderSidebar();

    screen.getByRole('button', { name: /submit claim/i }).click();

    expect(push).toHaveBeenCalledWith('/claims/new');
  });
});
