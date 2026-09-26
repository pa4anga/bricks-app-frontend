import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import type { Account } from '@/api/model';
import { server } from '@/mocks/server';

import { AccountsTable } from './AccountsTable';

const twoAccounts: Account[] = [
  { id: '1', username: 'ivan' },
  { id: '2', username: 'petar' },
];

const renderTable = (accounts: Account[], currentUsername: string, onDeleted = vi.fn()) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <AccountsTable accounts={accounts} currentUsername={currentUsername} onDeleted={onDeleted} />
    </SWRConfig>
  );

describe('AccountsTable', () => {
  it('renders every account username', () => {
    renderTable(twoAccounts, 'ivan');

    expect(screen.getByText('ivan')).toBeInTheDocument();
    expect(screen.getByText('petar')).toBeInTheDocument();
  });

  it('hides the actions menu for the current user but shows it for others', async () => {
    renderTable(twoAccounts, 'ivan');

    expect(screen.queryByRole('button', { name: 'Действия за ivan' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Действия за petar' }));

    expect(await screen.findByRole('menuitem', { name: 'Изтрий petar' })).toBeInTheDocument();
  });

  it('hides every actions menu when only one account remains', () => {
    renderTable([{ id: '1', username: 'ivan' }], 'petar');

    expect(screen.queryByRole('button', { name: /Действия/ })).not.toBeInTheDocument();
  });

  it('deletes an account and notifies the parent', async () => {
    server.use(http.delete('*/accounts/:id', ({ params }) => HttpResponse.json({ id: params.id }, { status: 200 })));
    const onDeleted = vi.fn();
    renderTable(twoAccounts, 'ivan', onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за petar' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий petar' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it('surfaces an error and does not notify the parent when deletion fails', async () => {
    server.use(http.delete('*/accounts/:id', () => HttpResponse.json({ message: 'fail' }, { status: 409 })));
    const onDeleted = vi.fn();
    renderTable(twoAccounts, 'ivan', onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за petar' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий petar' }));

    expect(await screen.findByText('Неуспешно изтриване на акаунта.')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
