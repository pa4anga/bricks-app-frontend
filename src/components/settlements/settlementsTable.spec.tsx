import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import type { Settlement } from '@/api/model';
import { INTERNAL_SETTLEMENT_EDIT_ROUTE } from '@/constants/routes';
import { server } from '@/mocks/server';

import { SettlementsTable } from './SettlementsTable';

const settlements: Settlement[] = [
  { _id: '1', name: 'София', coordinates: { type: 'Point', coordinates: [23.32, 42.7] } },
  { _id: '2', name: 'Пловдив', coordinates: { type: 'Point', coordinates: [24.75, 42.14] } },
];

const renderTable = (rows: Settlement[], onDeleted = vi.fn(), onPageChange = vi.fn()) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <SettlementsTable settlements={rows} page={1} pageCount={1} onPageChange={onPageChange} onDeleted={onDeleted} />
    </SWRConfig>
  );

describe('SettlementsTable', () => {
  it('splits the point into separate latitude and longitude columns for each settlement', () => {
    renderTable(settlements);

    expect(screen.getByText('София')).toBeInTheDocument();
    expect(screen.getByText('42.7')).toBeInTheDocument();
    expect(screen.getByText('23.32')).toBeInTheDocument();
    expect(screen.getByText('Пловдив')).toBeInTheDocument();
    expect(screen.getByText('42.14')).toBeInTheDocument();
    expect(screen.getByText('24.75')).toBeInTheDocument();
  });

  it('shows an actions menu for every row', () => {
    renderTable(settlements);

    expect(screen.getByRole('button', { name: 'Действия за София' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия за Пловдив' })).toBeInTheDocument();
  });

  it('links each row to its edit page', async () => {
    renderTable(settlements);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени София' })).toHaveAttribute(
      'href',
      INTERNAL_SETTLEMENT_EDIT_ROUTE('София')
    );

    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Пловдив' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Пловдив' })).toHaveAttribute(
      'href',
      INTERNAL_SETTLEMENT_EDIT_ROUTE('Пловдив')
    );
  });

  it('deletes a settlement by id and notifies the parent', async () => {
    server.use(http.delete('*/settlements/:id', ({ params }) => HttpResponse.json({ id: params.id }, { status: 200 })));
    const onDeleted = vi.fn();
    renderTable(settlements, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий София' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it('surfaces a generic error and keeps the parent untouched when deletion fails', async () => {
    server.use(http.delete('*/settlements/:id', () => HttpResponse.json({ message: 'missing' }, { status: 404 })));
    const onDeleted = vi.fn();
    renderTable(settlements, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий София' }));

    expect(await screen.findByText('Неуспешно изтриване на населеното място.')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
