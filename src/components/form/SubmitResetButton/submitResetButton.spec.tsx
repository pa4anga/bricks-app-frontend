import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SubmitResetButton } from './index';

const preventedSubmit = () => vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());

describe('SubmitResetButton', () => {
  it('submits the surrounding form through the primary button', async () => {
    const onSubmit = preventedSubmit();
    const onReset = vi.fn();

    render(
      <form onSubmit={onSubmit}>
        <SubmitResetButton onReset={onReset}>Search</SubmitResetButton>
      </form>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('fires the reset handler without submitting the form', async () => {
    const onSubmit = preventedSubmit();
    const onReset = vi.fn();

    render(
      <form onSubmit={onSubmit}>
        <SubmitResetButton onReset={onReset}>Search</SubmitResetButton>
      </form>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the primary button configurable and labels the reset button', () => {
    render(
      <SubmitResetButton onReset={vi.fn()} type="button" color="secondary" resetAriaLabel="Clear">
        Go
      </SubmitResetButton>
    );

    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('type', 'button');
  });

  it('disables only the submit button and leaves reset active', async () => {
    const onSubmit = preventedSubmit();
    const onReset = vi.fn();

    render(
      <form onSubmit={onSubmit}>
        <SubmitResetButton onReset={onReset} disabled>
          Search
        </SubmitResetButton>
      </form>
    );

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();

    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(reset).toBeEnabled();

    await userEvent.click(reset);

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
