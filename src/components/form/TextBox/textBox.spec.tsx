import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Form } from '@/components/form/Form';
import { TextBox } from '@/components/form/TextBox';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

describe('TextBox', () => {
  it('renders a labelled input inside a form', () => {
    render(
      <Form schema={schema} onSubmit={() => {}}>
        <TextBox name="email" label="Email" />
      </Form>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('records what the user types', async () => {
    render(
      <Form schema={schema} onSubmit={() => {}}>
        <TextBox name="email" label="Email" />
      </Form>
    );

    const input = screen.getByLabelText('Email');
    await userEvent.type(input, 'me@example.com');

    expect(input).toHaveValue('me@example.com');
  });

  it('throws a helpful error when rendered outside a Form', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TextBox name="email" label="Email" />)).toThrow('must be rendered inside a <Form>');

    consoleError.mockRestore();
  });
});
