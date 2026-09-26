import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ValidatedTextField } from '@/components/form/ValidatedTextField';
import type { IValidatedTextFieldHandle } from '@/components/form/ValidatedTextField';

describe('ValidatedTextField', () => {
  it('renders the header label and a grey hint below the input', () => {
    render(<ValidatedTextField label="Email" hint="We never share it" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();

    const hint = screen.getByText('We never share it');
    expect(hint).toBeInTheDocument();
    expect(hint).not.toHaveClass('Mui-error');
  });

  it('records what the user types', async () => {
    render(<ValidatedTextField label="Email" />);

    const input = screen.getByLabelText('Email');
    await userEvent.type(input, 'me@example.com');

    expect(input).toHaveValue('me@example.com');
  });

  it('validates live against the zod schema and swaps the hint for a red error', async () => {
    const schema = z.string().email('Enter a valid email');
    render(<ValidatedTextField label="Email" hint="Your email" schema={schema} />);

    const input = screen.getByLabelText('Email');
    await userEvent.type(input, 'not-an-email');

    const error = screen.getByText('Enter a valid email');
    expect(error).toHaveClass('Mui-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Your email')).not.toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'me@example.com');

    expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();
    expect(screen.getByText('Your email')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows an error passed via the error prop', () => {
    render(<ValidatedTextField label="Email" error="Server rejected this" />);

    expect(screen.getByText('Server rejected this')).toHaveClass('Mui-error');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('exposes imperative helpers to set and clear the hint and error', () => {
    const ref = createRef<IValidatedTextFieldHandle>();
    render(<ValidatedTextField label="Email" hint="Your email" ref={ref} />);

    act(() => ref.current?.setError('Boom'));
    expect(screen.getByText('Boom')).toHaveClass('Mui-error');

    act(() => ref.current?.clearError());
    expect(screen.queryByText('Boom')).not.toBeInTheDocument();
    expect(screen.getByText('Your email')).toBeInTheDocument();

    act(() => ref.current?.setHint('A brand new hint'));
    expect(screen.getByText('A brand new hint')).toBeInTheDocument();
  });

  it('imperative validate() runs the schema, sets the error and returns validity', () => {
    const ref = createRef<IValidatedTextFieldHandle>();
    const schema = z.string().min(3, 'Too short');
    render(<ValidatedTextField label="Name" schema={schema} ref={ref} />);

    let valid = true;
    act(() => {
      valid = ref.current?.validate() ?? true;
    });

    expect(valid).toBe(false);
    expect(screen.getByText('Too short')).toHaveClass('Mui-error');
  });
});
