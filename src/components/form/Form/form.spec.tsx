import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/components/form/Button';
import { Form } from '@/components/form/Form';
import { TextBox } from '@/components/form/TextBox';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});

const renderForm = (onSubmit: (values: z.infer<typeof schema>) => void) =>
  render(
    <Form schema={schema} onSubmit={onSubmit}>
      <TextBox name="name" label="Name" />
      <TextBox name="email" label="Email" />
      <Button type="submit">Submit</Button>
    </Form>
  );

describe('Form', () => {
  it('blocks submission and shows validation errors for invalid input', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('submits parsed values when every field is valid', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    await userEvent.type(screen.getByLabelText('Name'), 'Ada Lovelace');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('reveals a field error only after the field is blurred', async () => {
    renderForm(vi.fn());

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();

    await userEvent.tab();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });
});
