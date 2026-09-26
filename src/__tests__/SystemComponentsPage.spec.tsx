import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product, ProductPricing } from '@/api/model';
import { server } from '@/mocks/server';
import SystemComponentsPage from '@/pages/prices/system-components';

const product: Product = {
  _id: 'p1',
  name: 'Contiton 12',
  kind: 'Покриви',
  variant: 'Тъмно-кафяв',
  subtype: 'Основна керемида',
  systemComponents: [
    { name: 'Крайна дясна керемида', kind: 'Помощни керемиди' },
    { name: 'Четворник', kind: 'Керамични аксесоари' },
  ],
};

const pricing: ProductPricing = {
  pricePerUnit: 2.23,
  nearestLocation: 'Русе',
  distanceKm: 120,
  systemComponents: [
    { name: 'Крайна дясна керемида', pricePerUnit: 10.8, nearestLocation: 'Русе', distanceKm: 120 },
    { name: 'Четворник', pricePerUnit: 88.2, nearestLocation: 'Русе', distanceKm: 120 },
  ],
};

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: { product: 'p1', settlement: 'София' },
    isReady: true,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <SystemComponentsPage />
    </SWRConfig>
  );

describe('System components page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/products/p1/price', () => HttpResponse.json(pricing)),
      http.get('*/products/p1', () => HttpResponse.json(product))
    );
  });

  it('renders the grouped table with the product row and component rows', async () => {
    renderPage();

    const table = within(await screen.findByRole('table', { name: 'Системни компоненти' }));
    expect(table.getByText('Contiton 12 (цвят: Тъмно-кафяв)')).toBeInTheDocument();
    expect(table.getByText('Основна керемида')).toBeInTheDocument();
    expect(table.getByText('Помощни керемиди')).toBeInTheDocument();
    expect(table.getByText('Крайна дясна керемида (цвят: Тъмно-кафяв)')).toBeInTheDocument();
    expect(table.getByText('88.20 €')).toBeInTheDocument();
  });

  it('links Назад back to the roof-tiles catalog with product and settlement', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Системни компоненти' });

    expect(screen.getByRole('link', { name: /Назад/ })).toHaveAttribute(
      'href',
      `/prices/roof-tiles?product=p1&settlement=${encodeURIComponent('София')}`
    );
  });

  it('triggers window.print from both the print and save-as-PDF actions', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPage();
    await screen.findByRole('table', { name: 'Системни компоненти' });

    await userEvent.click(screen.getByRole('button', { name: /Печат/ }));
    await userEvent.click(screen.getByRole('button', { name: /Запази като PDF/ }));

    expect(printSpy).toHaveBeenCalledTimes(2);
    printSpy.mockRestore();
  });
});
