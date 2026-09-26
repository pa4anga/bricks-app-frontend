import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product, Settlement } from '@/api/model';
import { server } from '@/mocks/server';
import PavementPricesPage from '@/pages/prices/pavement';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, isReady: true, push: vi.fn() }),
}));

const products: Product[] = [
  {
    _id: 'p1',
    name: 'Плоча 20x20',
    variant: 'Пясъчен',
    subtype: 'Тротоарни',
    system: 'Сива',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p2',
    name: 'Плоча 30x30',
    variant: 'Антрацит',
    subtype: 'Тротоарни',
    system: 'Сива',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p3',
    name: 'Плоча Ретро',
    variant: 'Теракота',
    subtype: 'Тротоарни',
    system: 'Червена',
    sourceLocation: 'Лудогорие',
  },
  {
    _id: 'p4',
    name: 'Бордюр Пътен',
    variant: 'Стоманен',
    subtype: 'Бордюри',
    system: 'Гранит',
    sourceLocation: 'Марица',
  },
];

const settlements: Settlement[] = [
  { _id: 's1', name: 'София', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 120 }] },
  { _id: 's2', name: 'Пловдив', distances: [{ source: 'Марица', nearestLocation: 'Пловдив', distanceKm: 30 }] },
  { _id: 's3', name: 'Варна', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 90 }] },
];

const renderPage = async () => {
  render(<PavementPricesPage />);
  await screen.findByRole('button', { name: /Изберете Категория/ });
};

const selectFullCascade = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));
  await userEvent.click(screen.getByRole('button', { name: /Изберете населено място/ }));
  await userEvent.type(await screen.findByRole('textbox'), 'София');
  await userEvent.click(screen.getByRole('button', { name: 'София' }));
};

describe('Pavement prices page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/products/search', () => HttpResponse.json(products)),
      http.get('*/settlements', () => HttpResponse.json(settlements))
    );
  });

  it('renders the page heading', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Настилки и аксесоари' })).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));

    const systemButton = screen.getByRole('button', { name: /Изберете Система/ });
    expect(systemButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();

    await userEvent.click(systemButton);
    expect(screen.getByRole('button', { name: 'Сива' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Червена' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Гранит' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));

    const colourButton = screen.getByRole('button', { name: /Изберете Цвят/ });
    expect(colourButton).toBeEnabled();

    await userEvent.click(colourButton);
    expect(screen.getByRole('button', { name: 'Пясъчен' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Антрацит' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Теракота' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Стоманен' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));

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
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));
    expect(screen.getByRole('button', { name: /Пясъчен/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Тротоарни/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Бордюри' }));

    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Пясъчен/ })).not.toBeInTheDocument();
  });

  it('clears the colour when the system changes', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));
    expect(screen.getByRole('button', { name: /Пясъчен/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
    await userEvent.click(screen.getByRole('button', { name: 'Червена' }));

    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Пясъчен/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    expect(screen.getByRole('button', { name: 'Теракота' })).toBeInTheDocument();
  });

  it('keeps the chosen settlement when the colour or the system changes', async () => {
    await renderPage();

    await selectFullCascade();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));
    await userEvent.click(screen.getByRole('button', { name: 'Антрацит' }));
    expect(screen.getByRole('button', { name: /Антрацит/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
    await userEvent.click(screen.getByRole('button', { name: 'Червена' }));
    expect(screen.getByRole('button', { name: /Изберете Цвят/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /София/ })).toBeInTheDocument();
  });

  it('resets the whole cascade when the reset button is pressed', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Цвят/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Пясъчен' }));

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
    expect(within(panel).getByText('Плоча 20x20')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Изчистване на филтрите' }));

    expect(screen.queryByRole('region', { name: 'Резултат' })).not.toBeInTheDocument();
  });
});
