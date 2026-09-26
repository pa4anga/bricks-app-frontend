import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { Product } from '@/api/model';
import { ProductsTable } from '@/components/products';
import { BRICK_PRODUCT_KIND, ROOF_PRODUCT_KIND } from '@/constants/productKinds';
import {
  INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE,
  INTERNAL_PRODUCT_EDIT_ROUTE,
  INTERNAL_PRODUCT_VIEW_ROUTE,
} from '@/constants/routes';
import { server } from '@/mocks/server';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), query: {} }),
  default: { push: vi.fn() },
}));

const products: Product[] = [
  {
    _id: 'p1',
    name: 'Тондах Родон',
    subtype: 'Керемида',
    system: 'Родон',
    variant: 'Натурал',
    rawUnitPrice: 2.5,
    sourceLocation: 'Луковит',
    feeCategory: 'Стандарт',
    sapNumber: 'SAP-1',
    unitsPerSquareMeter: 10,
  },
];

const renderTable = (onDeleted: () => void = vi.fn()) =>
  render(
    <ProductsTable
      products={products}
      productKind={ROOF_PRODUCT_KIND}
      page={1}
      pageCount={1}
      onPageChange={vi.fn()}
      onDeleted={onDeleted}
    />
  );

describe('ProductsTable', () => {
  it('renders the subtype, system and variant columns with their values', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Тип' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Система' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Вариант' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Производствена база' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Бр./кв.м' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Керемида' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Родон' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Луковит' })).toBeInTheDocument();
  });

  it('omits the system, variant and units columns for kinds that do not use them', () => {
    render(
      <ProductsTable
        products={products}
        productKind={BRICK_PRODUCT_KIND}
        page={1}
        pageCount={1}
        onPageChange={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.queryByRole('columnheader', { name: 'Система' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Вариант' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Бр./кв.м' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Тип' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'SAP номер' })).toBeInTheDocument();
  });

  it('links the view, create-variant and edit actions for each row', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole('button', { name: 'Действия за Тондах Родон' }));

    expect(await screen.findByRole('menuitem', { name: 'Преглед Тондах Родон' })).toHaveAttribute(
      'href',
      INTERNAL_PRODUCT_VIEW_ROUTE('p1')
    );
    expect(screen.getByRole('menuitem', { name: 'Създай вариант от Тондах Родон' })).toHaveAttribute(
      'href',
      INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE(ROOF_PRODUCT_KIND.slug, 'p1')
    );
    expect(screen.getByRole('menuitem', { name: 'Промени Тондах Родон' })).toHaveAttribute(
      'href',
      INTERNAL_PRODUCT_EDIT_ROUTE('p1')
    );
  });

  it('deletes a product and notifies the parent', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    server.use(http.delete('*/products/p1', () => new HttpResponse(null, { status: 204 })));

    renderTable(onDeleted);
    await user.click(screen.getByRole('button', { name: 'Действия за Тондах Родон' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Изтрий Тондах Родон' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });

  it('shows an error when deletion fails', async () => {
    const user = userEvent.setup();
    server.use(http.delete('*/products/p1', () => HttpResponse.json({ message: 'nope' }, { status: 500 })));

    renderTable();
    await user.click(screen.getByRole('button', { name: 'Действия за Тондах Родон' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Изтрий Тондах Родон' }));

    expect(await screen.findByText('Неуспешно изтриване на продукта.')).toBeInTheDocument();
  });
});
