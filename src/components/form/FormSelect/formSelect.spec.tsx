import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { ISelectButtonHandle } from '@/components/common';
import { Button } from '@/components/form/Button';
import { Form } from '@/components/form/Form';

import { FormSelect } from './index';

interface IOption {
  id: number;
  name: string;
}

const options: IOption[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
];

const getName = (option: IOption) => option.name;
const getId = (option: IOption) => option.id;

const schema = z.object({
  user: z.object({ id: z.number(), name: z.string() }).nullable(),
});

describe('FormSelect', () => {
  it('feeds the chosen item into the form submission', async () => {
    const onSubmit = vi.fn();

    render(
      <Form schema={schema} onSubmit={onSubmit} initialValues={{ user: null }}>
        <FormSelect name="user" items={options} initialLabel="Choose" getLabel={getName} getKey={getId} />
        <Button type="submit">Submit</Button>
      </Form>
    );

    await userEvent.click(screen.getByRole('button', { name: /Choose/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith({ user: { id: 1, name: 'Ada Lovelace' } });
  });

  it('resets to the initial label and clears the value through the ref', async () => {
    const ref = createRef<ISelectButtonHandle<IOption>>();
    const onSubmit = vi.fn();

    render(
      <Form schema={schema} onSubmit={onSubmit} initialValues={{ user: null }}>
        <FormSelect ref={ref} name="user" items={options} initialLabel="Choose" getLabel={getName} getKey={getId} />
        <Button type="submit">Submit</Button>
      </Form>
    );

    await userEvent.click(screen.getByRole('button', { name: /Choose/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument();

    act(() => ref.current?.reset());
    expect(screen.getByRole('button', { name: /Choose/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenLastCalledWith({ user: null });
  });
});
