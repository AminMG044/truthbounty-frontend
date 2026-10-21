import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimStatementForm, { type ClaimStatementDraft } from '../ClaimStatementForm';
import {
  clearQuarantinedDraft,
  readQuarantinedDraft,
  saveLocalDraft,
  type DraftScope,
} from '@/lib/drafts/recoverable-draft';

const SCOPE: DraftScope = {
  address: null,
  chainId: 10,
  releaseId: 'optimism-v2-release',
};

const SAVED_STATEMENT: ClaimStatementDraft = {
  title: 'Unsafe chemical discharge',
  category: 'Environment',
  geographicScope: 'North district',
  verificationContext: 'Compare the public test results with the dated inspection report.',
};

const FORM_ID = 'claim-statement';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ClaimStatementForm', () => {
  it('summarizes validation errors and associates them with the fields', async () => {
    const user = userEvent.setup();
    render(<ClaimStatementForm scope={SCOPE} />);

    await user.click(screen.getByRole('button', { name: 'Review statement' }));

    expect(await screen.findByRole('alert', { name: 'Review these fields' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-describedby', 'claim-statement-title-error');
    expect(screen.getByRole('link', { name: /Category: Choose a category/ })).toHaveAttribute('href', '#claim-statement-category');
    expect(screen.queryByRole('button', { name: /connect wallet/i })).not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toHaveAttribute('aria-labelledby', 'claim-statement-error-heading'));
  });

  it('offers explicit recovery, restores only approved fields, and discards the local draft', async () => {
    const user = userEvent.setup();
    saveLocalDraft(FORM_ID, SCOPE, SAVED_STATEMENT, (value): value is ClaimStatementDraft =>
      typeof value === 'object' && value !== null && Object.keys(value).length === 4,
    );
    render(<ClaimStatementForm scope={SCOPE} />);

    const restore = await screen.findByRole('button', { name: 'Restore saved statement' });
    expect(screen.getByLabelText('Title')).toHaveValue('');
    await user.click(restore);

    expect(screen.getByLabelText('Title')).toHaveValue(SAVED_STATEMENT.title);
    expect(JSON.parse(localStorage.getItem(`truthbounty:form-draft:${FORM_ID}`) ?? '{}').payload)
      .toEqual(SAVED_STATEMENT);
    await user.click(screen.getByRole('button', { name: 'Discard draft' }));
    expect(localStorage.getItem(`truthbounty:form-draft:${FORM_ID}`)).toBeNull();
  });

  it('quarantines drafts from another protocol release and permits explicit discard', async () => {
    const user = userEvent.setup();
    saveLocalDraft(FORM_ID, { ...SCOPE, releaseId: 'previous-release' }, SAVED_STATEMENT);
    render(<ClaimStatementForm scope={SCOPE} />);

    expect(await screen.findByText(/different protocol release/i)).toBeInTheDocument();
    expect(readQuarantinedDraft(FORM_ID)?.reason).toBe('release-change');
    await user.click(screen.getByRole('button', { name: 'Discard stale statement' }));
    expect(readQuarantinedDraft(FORM_ID)).toBeNull();
  });

  it('does not read or write drafts when protocol configuration is unavailable', async () => {
    const user = userEvent.setup();
    const unavailableScope = { ...SCOPE, releaseId: 'unknown' };
    render(<ClaimStatementForm scope={unavailableScope} />);

    expect(screen.getByText(/pinned protocol release is not configured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue to evidence' })).toBeDisabled();
    await user.type(screen.getByLabelText('Title'), 'A locally written statement');
    expect(screen.getByLabelText('Title')).toHaveValue('A locally written statement');
    await user.click(screen.getByRole('button', { name: 'Review statement' }));
    expect(localStorage.getItem(`truthbounty:form-draft:${FORM_ID}`)).toBeNull();
  });
});