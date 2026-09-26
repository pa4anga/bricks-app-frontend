import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaginatedTable } from './PaginatedTable';
import type { IPaginatedTableColumn } from './types';

interface Row {
  id: string;
  label: string;
}

const rows: Row[] = [
  { id: '1', label: 'Първи' },
  { id: '2', label: 'Втори' },
];

const columns: IPaginatedTableColumn<Row>[] = [{ key: 'label', header: 'Етикет', render: row => row.label }];

const setup = (page: number, pageCount: number, onPageChange = vi.fn()) => {
  render(
    <PaginatedTable
      ariaLabel="Таблица"
      columns={columns}
      rows={rows}
      getRowKey={row => row.id}
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
  );

  return { onPageChange };
};

describe('PaginatedTable', () => {
  it('renders the column header and every row through the render function', () => {
    setup(1, 20);

    expect(screen.getByText('Етикет')).toBeInTheDocument();
    expect(screen.getByText('Първи')).toBeInTheDocument();
    expect(screen.getByText('Втори')).toBeInTheDocument();
  });

  it('shows exactly ten page buttons starting at one on the first page', () => {
    setup(1, 20);

    expect(screen.getByRole('button', { name: 'Страница 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Страница 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Страница 11' })).not.toBeInTheDocument();
  });

  it('reports the clicked page number to the parent', async () => {
    const { onPageChange } = setup(1, 20);

    await userEvent.click(screen.getByRole('button', { name: 'Страница 4' }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables the first button and jumps to the end from the first page', async () => {
    const { onPageChange } = setup(1, 20);

    expect(screen.getByRole('button', { name: 'Първа страница' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Последна страница' }));

    expect(onPageChange).toHaveBeenCalledWith(20);
  });

  it('disables the last button on the final page', () => {
    setup(20, 20);

    expect(screen.getByRole('button', { name: 'Последна страница' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Първа страница' })).toBeEnabled();
  });

  it('jumps to a valid page entered in the jump field', async () => {
    const { onPageChange } = setup(1, 20);

    fireEvent.change(screen.getByLabelText('Към страница'), { target: { value: '7' } });
    await userEvent.click(screen.getByRole('button', { name: 'Отиди' }));

    expect(onPageChange).toHaveBeenCalledWith(7);
  });

  it('rejects an out-of-range jump target without notifying the parent', async () => {
    const { onPageChange } = setup(1, 20);

    fireEvent.change(screen.getByLabelText('Към страница'), { target: { value: '99' } });
    await userEvent.click(screen.getByRole('button', { name: 'Отиди' }));

    expect(await screen.findByText('Въведете страница между 1 и 20.')).toBeInTheDocument();
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
