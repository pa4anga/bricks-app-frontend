import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import type { FeeCategory } from '@/api/model';
import { INTERNAL_FEE_CATEGORY_EDIT_ROUTE } from '@/constants/routes';
import { server } from '@/mocks/server';

import { FeeCategoriesTable } from './FeeCategoriesTable';

const feeCategories: FeeCategory[] = [
  { _id: '1', name: 'Стандартна', percentage: 20 },
  { _id: '2', name: 'Промоция', percentage: 12.5 },
];

const renderTable = (categories: FeeCategory[], onDeleted = vi.fn()) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <FeeCategoriesTable feeCategories={categories} onDeleted={onDeleted} />
    </SWRConfig>
  );

describe('FeeCategoriesTable', () => {
  it('renders every fee category name and its percentage followed by a percent sign', () => {
    renderTable(feeCategories);

    expect(screen.getByText('Стандартна')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Промоция')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('shows an actions menu for every row', () => {
    renderTable(feeCategories);

    expect(screen.getByRole('button', { name: 'Действия за Стандартна' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия за Промоция' })).toBeInTheDocument();
  });

  it('links each row to its edit page', async () => {
    renderTable(feeCategories);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Стандартна' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Стандартна' })).toHaveAttribute(
      'href',
      INTERNAL_FEE_CATEGORY_EDIT_ROUTE('Стандартна')
    );

    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Промоция' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Промоция' })).toHaveAttribute(
      'href',
      INTERNAL_FEE_CATEGORY_EDIT_ROUTE('Промоция')
    );
  });

  it('deletes a fee category and notifies the parent', async () => {
    server.use(
      http.delete('*/fee-categories/:name', ({ params }) => HttpResponse.json({ name: params.name }, { status: 200 }))
    );
    const onDeleted = vi.fn();
    renderTable(feeCategories, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Стандартна' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий Стандартна' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it('surfaces the in-use error and keeps the parent untouched when the API blocks deletion with a 409', async () => {
    server.use(
      http.delete('*/fee-categories/:name', () => HttpResponse.json({ message: 'referenced' }, { status: 409 }))
    );
    const onDeleted = vi.fn();
    renderTable(feeCategories, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Стандартна' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий Стандартна' }));

    expect(
      await screen.findByText('Категорията надценка се използва от продукт и не може да бъде изтрита.')
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('surfaces a generic error when deletion fails for another reason', async () => {
    server.use(http.delete('*/fee-categories/:name', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    const onDeleted = vi.fn();
    renderTable(feeCategories, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Промоция' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий Промоция' }));

    expect(await screen.findByText('Неуспешно изтриване на категорията надценка.')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
