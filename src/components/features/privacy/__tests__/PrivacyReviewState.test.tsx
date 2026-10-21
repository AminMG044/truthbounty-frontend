import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyReviewState, PrivacyReviewSummary } from '../PrivacyReviewState';

describe('PrivacyReviewState', () => {
  it('returns null for approved status', () => {
    const { container } = render(
      <PrivacyReviewState
        status="approved"
        clauseTitle="Wallet & Blockchain Data"
        network="testnet"
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders review banner for review status', () => {
    render(
      <PrivacyReviewState
        status="review"
        reviewerNotes="Pending legal review"
        clauseTitle="Telemetry & Logs"
        network="mainnet"
      />,
    );

    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText(/NOT yet legally approved or effective/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mainnet clause')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Under Review: Telemetry & Logs');
  });

  it('renders unavailable banner for unavailable status', () => {
    render(
      <PrivacyReviewState
        status="unavailable"
        clauseTitle="Jurisdiction"
        network="testnet"
      />,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/pending legal authorization/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Testnet clause')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveAttribute('aria-label', 'Unavailable: Jurisdiction');
  });

  it('shows reviewer notes in details when provided', () => {
    render(
      <PrivacyReviewState
        status="review"
        reviewerNotes="Review notes detailing regulatory check."
        clauseTitle="Telemetry & Logs"
        network="testnet"
      />,
    );

    expect(screen.getByText('Reviewer Notes')).toBeInTheDocument();
    const summary = screen.getByText('Reviewer Notes');
    fireEvent.click(summary);
    expect(screen.getByText('Review notes detailing regulatory check.')).toBeInTheDocument();
  });

  it('does not show reviewer notes section when notes are absent', () => {
    render(
      <PrivacyReviewState
        status="review"
        clauseTitle="Telemetry & Logs"
        network="testnet"
      />,
    );

    expect(screen.queryByText('Reviewer Notes')).not.toBeInTheDocument();
  });
});

describe('PrivacyReviewSummary', () => {
  it('returns null when all clauses are approved', () => {
    const clauses = [
      { id: 'wallet', title: 'Wallet', status: 'approved' as const },
      { id: 'session', title: 'Session', status: 'approved' as const },
    ];

    const { container } = render(
      <PrivacyReviewSummary clauses={clauses} network="testnet" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders summary counts when review or unavailable clauses exist', () => {
    const clauses = [
      { id: 'wallet', title: 'Wallet', status: 'approved' as const },
      { id: 'logs', title: 'Logs', status: 'review' as const },
      { id: 'jurisdiction', title: 'Jurisdiction', status: 'unavailable' as const },
    ];

    render(<PrivacyReviewSummary clauses={clauses} network="mainnet" />);

    const summary = screen.getByRole('region', { name: 'Privacy review summary' });
    expect(within(summary).getByText('Clause Approval Summary')).toBeInTheDocument();
    expect(within(summary).getAllByText('1')).toHaveLength(3);
    expect(within(summary).getByText('Under Review')).toBeInTheDocument();
    expect(within(summary).getByText('Unavailable')).toBeInTheDocument();
    expect(within(summary).getByText(/Only clauses with Approved status are legally effective/)).toBeInTheDocument();
  });
});
