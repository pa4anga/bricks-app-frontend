import TextField from '@mui/material/TextField';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { FieldArray } from '@/components/form/FieldArray';
import type { IFieldArrayEntryProps, IFieldArrayHandle } from '@/components/form/FieldArray';

interface Person {
  name: string;
}

const PersonEntry = ({ value, onChange, error }: IFieldArrayEntryProps<Person>) => (
  <TextField
    label="Name"
    value={value.name}
    onChange={event => onChange({ ...value, name: event.target.value })}
    error={Boolean(error)}
    helperText={error}
  />
);

interface IHarnessProps {
  initial?: Person[];
  schema?: z.ZodType<Person>;
  fieldRef?: Ref<IFieldArrayHandle>;
}

const Harness = ({ initial = [], schema, fieldRef }: IHarnessProps) => {
  const [items, setItems] = useState<Person[]>(initial);

  return (
    <FieldArray
      value={items}
      onChange={setItems}
      component={PersonEntry}
      createEntry={() => ({ name: '' })}
      entrySchema={schema}
      ref={fieldRef}
    />
  );
};

describe('FieldArray', () => {
  it('prepopulates one entry subcomponent per item in the data array', () => {
    render(<Harness initial={[{ name: 'Ada' }, { name: 'Linus' }]} />);

    const inputs = screen.getAllByLabelText('Name');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('Ada');
    expect(inputs[1]).toHaveValue('Linus');
  });

  it('spawns a new empty entry when the green add button is clicked', async () => {
    render(<Harness initial={[{ name: 'Ada' }]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));

    const inputs = screen.getAllByLabelText('Name');
    expect(inputs).toHaveLength(2);
    expect(inputs[1]).toHaveValue('');
  });

  it('removes the matching entry when its red delete button is clicked', async () => {
    render(<Harness initial={[{ name: 'Ada' }, { name: 'Linus' }, { name: 'Grace' }]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove entry 2' }));

    const inputs = screen.getAllByLabelText('Name');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('Ada');
    expect(inputs[1]).toHaveValue('Grace');
  });

  it('updates the array as the user edits an entry', async () => {
    render(<Harness initial={[{ name: '' }]} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');

    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });

  it('validates every entry against the schema and surfaces per-entry errors', async () => {
    const ref = createRef<IFieldArrayHandle>();
    const schema = z.object({ name: z.string().min(1, 'Name is required') });

    render(<Harness initial={[{ name: 'Ada' }, { name: '' }]} schema={schema} fieldRef={ref} />);

    let valid = true;
    act(() => {
      valid = ref.current?.validate() ?? true;
    });

    expect(valid).toBe(false);
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    const inputs = screen.getAllByLabelText('Name');
    await userEvent.type(inputs[1], 'Linus');

    act(() => {
      valid = ref.current?.validate() ?? false;
    });

    expect(valid).toBe(true);
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  it('renders a red x delete button per entry and a single green plus add button', () => {
    render(<Harness initial={[{ name: 'Ada' }]} />);

    const remove = screen.getByRole('button', { name: 'Remove entry 1' });
    expect(within(remove).getByTestId('CloseIcon')).toBeInTheDocument();

    const add = screen.getByRole('button', { name: 'Add entry' });
    expect(within(add).getByTestId('AddIcon')).toBeInTheDocument();
  });
});
