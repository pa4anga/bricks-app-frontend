import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product, Settlement } from '@/api/model';
import { server } from '@/mocks/server';
import BricksPricesPage from '@/pages/prices/bricks';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, push: vi.fn() }),
}));

const products: Product[] = [
  { _id: 'p1', name: 'Тухла 25', subtype: 'Поротон', sourceLocation: 'Лудогорие' },
  { _id: 'p2', name: 'Тухла 38', subtype: 'Поротон', sourceLocation: 'Лудогорие' },
  { _id: 'p3', name: 'Керемида', subtype: 'Покрив', sourceLocation: 'Марица' },
];

const settlements: Settlement[] = [
  { _id: 's1', name: 'София', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 120 }] },
  { _id: 's2', name: 'Пловдив', distances: [{ source: 'Марица', nearestLocation: 'Пловдив', distanceKm: 30 }] },
  { _id: 's3', name: 'Варна', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 90 }] },
];

const renderPage = async () => {
  render(<BricksPricesPage />);
  await screen.findByRole('button', { name: /Изберете Категория/ });
};

describe('Bricks prices page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/products/search', () => HttpResponse.json(products)),
      http.get('*/settlements', () => HttpResponse.json(settlements))
    );
  });

  it('renders the page heading', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Брутни регионални цени' })).toBeInTheDocument();
  });

  it('disables the dependent selects and submit until prerequisites are chosen', async () => {
    await renderPage();

    expect(screen.getByRole('button', { name: /Изберете Категория/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Търсене' })).toBeDisabled();
  });

  it('cascades category → product → settlement, filters options, and enables submit', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));

    const productButton = screen.getByRole('button', { name: /Изберете Продукт/ });
    expect(productButton).toBeEnabled();

    await userEvent.click(productButton);
    expect(screen.getByRole('button', { name: 'Тухла 25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Тухла 38' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Керемида' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));

    const settlementButton = screen.getByRole('button', { name: /Изберете населено място/ });
    expect(settlementButton).toBeEnabled();

    await userEvent.click(settlementButton);
    const settlementSearch = await screen.findByRole('textbox');

    await userEvent.type(settlementSearch, 'Пло');
    expect(screen.queryByRole('button', { name: 'Пловдив' })).not.toBeInTheDocument();

    await userEvent.clear(settlementSearch);
    await userEvent.type(settlementSearch, 'Варна');
    expect(screen.getByRole('button', { name: 'Варна' })).toBeInTheDocument();

    await userEvent.clear(settlementSearch);
    await userEvent.type(settlementSearch, 'София');
    expect(screen.getByRole('button', { name: 'София' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'София' }));

    expect(screen.getByRole('button', { name: 'Търсене' })).toBeEnabled();
  });

  it('clears the chosen product when the category changes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));
    expect(screen.getByRole('button', { name: /Тухла 25/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Поротон/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Покрив' }));

    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Тухла 25/ })).not.toBeInTheDocument();
  });

  it('keeps the chosen settlement when the product or the category changes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете населено място/ }));
    await userEvent.type(await screen.findByRole('textbox'), 'София');
    await userEvent.click(screen.getByRole('button', { name: 'София' }));
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Тухла 25/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 38' }));
    expect(screen.getByRole('button', { name: /Тухла 38/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Поротон/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Покрив' }));
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();
  });

  it('resets the whole cascade when the reset button is pressed', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));

    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Изчистване на филтрите' }));

    expect(screen.getByRole('button', { name: /Изберете Категория/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Търсене' })).toBeDisabled();
  });

  it('shows a result panel with the product name after a successful price query and hides it on reset', async () => {
    server.use(
      http.get('*/products/:id/price', () =>
        HttpResponse.json({ pricePerUnit: 12.5, nearestLocation: 'Русе', distanceKm: 120, systemComponents: [] })
      )
    );

    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете населено място/ }));
    await userEvent.type(await screen.findByRole('textbox'), 'София');
    await userEvent.click(screen.getByRole('button', { name: 'София' }));

    expect(screen.queryByRole('region', { name: 'Резултат' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Търсене' }));

    const panel = await screen.findByRole('region', { name: 'Резултат' });
    expect(within(panel).getByText('Тухла 25')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Изчистване на филтрите' }));

    expect(screen.queryByRole('region', { name: 'Резултат' })).not.toBeInTheDocument();
  });

  it('exposes Print and Save actions that call window.print after a successful query', async () => {
    server.use(
      http.get('*/products/:id/price', () =>
        HttpResponse.json({ pricePerUnit: 12.5, nearestLocation: 'Русе', distanceKm: 120, systemComponents: [] })
      )
    );
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тухла 25' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете населено място/ }));
    await userEvent.type(await screen.findByRole('textbox'), 'София');
    await userEvent.click(screen.getByRole('button', { name: 'София' }));
    await userEvent.click(screen.getByRole('button', { name: 'Търсене' }));

    const printButton = await screen.findByRole('button', { name: /Печат/ });
    await userEvent.click(printButton);
    await userEvent.click(screen.getByRole('button', { name: /Запази като PDF/ }));

    expect(printSpy).toHaveBeenCalledTimes(2);
    printSpy.mockRestore();
  });
});
