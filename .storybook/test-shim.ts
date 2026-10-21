import { expect, vi } from 'vitest';
import { within, waitFor, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fn = vi.fn;

export { expect, fn, within, waitFor, fireEvent, screen, userEvent };
export default { expect, fn, within, waitFor, fireEvent, screen, userEvent };
