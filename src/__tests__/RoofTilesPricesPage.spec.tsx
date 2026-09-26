import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product, Settlement } from '@/api/model';
import { server } from '@/mocks/server';
import RoofTilesPricesPage from '@/pages/prices/roof-tiles';

const routerState = vi.hoisted(() => ({ query: {} as Record<string, string> }));

vi.mock('next/router', () => ({
  useRouter: () => ({ query: routerState.query, isReady: true, push: vi.fn() }),
}));

const products: Product[] = [
  {
    _id: 'p1',
    name: 'Керемида Класик',
    variant: 'Теракота',
    subtype: 'Глинени',
    system: 'Класик',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p2',
    name: 'Керемида Класик М',
    variant: 'Кафяв',
    subtype: 'Глинени',
    system: 'Класик',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p3',
    name: 'Керемида Модерн',
    variant: 'Графит',
    subtype: 'Глинени',
    system: 'Модерн',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p4',
    name: 'Бетонна керемида',
    variant: 'Червен',
    subtype: 'Бетонни',
    system: 'Стандарт',
    sourceLocation: 'Марица',
  },
];

const settlements: Settlement[] = [
  { _id: 's1', name: 'София', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 120 }] },
  { _id: 's2', name: 'Пловдив', distances: [{ source: 'Марица', nearestLocation: 'Пловдив', distanceKm: 30 }] },
  { _id: 's3', name: 'Варна', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 90 }] },
];

const renderPage = async () => {
  render(<RoofTilesPricesPage />);
  await screen.findByRole('button', { name: /Изберете Категория/ });
};

const selectFullCascade = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Глинени' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете населено място/ }));
  await userEvent.type(await screen.findByRole('textbox'), 'София');
  await userEvent.click(screen.getByRole('button', { name: 'София' }));
};

describe('Roof tiles prices page', () => {
  beforeEach(() => {
    routerState.query = {};
    server.use(
      http.get('*/products/search', () => HttpResponse.json(products)),
      http.get('*/settlements', () => HttpResponse.json(settlements))
    );
  });

  it('restores the selected product and settlement from the URL and shows the result', async () => {
    routerState.query = { product: 'p1', settlement: 'София' };
    server.use(
      http.get('*/products/:id/price', () =>
        HttpResponse.json({ pricePerUnit: 1.06, nearestLocation: 'Русе', distanceKm: 120, systemComponents: [] })
      )
    );

    render(<RoofTilesPricesPage />);

    expect(await screen.findByRole('region', { name: 'Резултат' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Керемида Класик' })).toBeInTheDocument();
  });

  it('renders the page heading', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Керемиди и аксесоари' })).toBeInTheDocument();
  });

  it('disables the dependent selects and submit until prerequisites are chosen', async () => {
    await renderPage();

    expect(screen.getByRole('button', { name: /Изберете Категория/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Търсене' })).toBeDisabled();
  });

  it('cascades category → system → colour → settlement, filters options, and enables submit', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Глинени' }));

    const systemButton = screen.getByRole('button', { name: /Изберете Система/ });
    expect(systemButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();

    await userEvent.click(systemButton);
    expect(screen.getByRole('button', { name: 'Класик' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Модерн' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Стандарт' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));

    const colourButton = screen.getByRole('button', { name: /Изберете Цвят/ });
    expect(colourButton).toBeEnabled();

    await userEvent.click(colourButton);
    expect(screen.getByRole('button', { name: 'Теракота' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Кафяв' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Графит' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Червен' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));

    const settlementButton = screen.getByRole('button', { name: /Изберете населено място/ });
    expect(settlementButton).toBeEnabled();

    await userEvent.click(settlementButton);
    const settlementSearch = await screen.findByRole('textbox');

    await userEvent.type(settlementSearch, 'Пло');
    expect(screen.queryByRole('button', { name: 'Пловдив' })).not.toBeInTheDocument();

    await userEvent.clear(settlementSearch);
    await userEvent.type(settlementSearch, 'София');
    expect(screen.getByRole('button', { name: 'София' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'София' }));

    expect(screen.getByRole('button', { name: 'Търсене' })).toBeEnabled();
  });

  it('clears the system and colour when the category changes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Глинени' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));
    expect(screen.getByRole('button', { name: /Теракота/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Глинени/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Бетонни' }));

    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Теракота/ })).not.toBeInTheDocument();
  });

  it('clears the colour when the system changes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Глинени' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));
    expect(screen.getByRole('button', { name: /Теракота/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
    await userEvent.click(screen.getByRole('button', { name: 'Модерн' }));

    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Теракота/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    expect(screen.getByRole('button', { name: 'Графит' })).toBeInTheDocument();
  });

  it('keeps the chosen settlement when the colour or the system changes', async () => {
    await renderPage();

    await selectFullCascade();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));
    await userEvent.click(screen.getByRole('button', { name: 'Кафяв' }));
    expect(screen.getByRole('button', { name: /Кафяв/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
    await userEvent.click(screen.getByRole('button', { name: 'Модерн' }));
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();
  });

  it('resets the whole cascade when the reset button is pressed', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Глинени' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Класик' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Теракота' }));

    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Изчистване на филтрите' }));

    expect(screen.getByRole('button', { name: /Изберете Категория/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();
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
    await selectFullCascade();

    expect(screen.queryByRole('region', { name: 'Резултат' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Търсене' }));

    const panel = await screen.findByRole('region', { name: 'Резултат' });
    expect(within(panel).getByText('Керемида Класик')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Изчистване на филтрите' }));

    expect(screen.queryByRole('region', { name: 'Резултат' })).not.toBeInTheDocument();
  });
});
