import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product } from '@/api/model';
import { ProductView } from '@/components/products';
import { server } from '@/mocks/server';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: { id: 'b1' }, isReady: true }),
  default: { push },
}));

const brick: Product = {
  _id: 'b1',
  name: 'Wienerberger Porotherm',
  kind: 'Тухли',
  system: 'Няма система',
  variant: 'Базов',
  subtype: 'Блок',
  rawUnitPrice: 1.8,
  countPerPallet: 80,
  unitWeightKg: 12.5,
  pricePerSquareMeter: 28.8,
  sourceLocation: 'Луковит',
  feeCategory: 'Стандарт',
  sapNumber: 'SAP-B1',
  imageId: 'img-1',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-02-20T08:00:00.000Z',
  systemComponents: [{ name: 'Скрит компонент', kind: 'Аксесоари', rawUnitPrice: 1 }],
};

const renderView = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <ProductView />
    </SWRConfig>
  );

describe('ProductView', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(http.get('*/products/b1', () => HttpResponse.json(brick, { status: 200 })));
  });

  it('shows the image, name and scalar fields including derived ones', async () => {
    renderView();

    expect(await screen.findByRole('heading', { name: 'Wienerberger Porotherm' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Wienerberger Porotherm' })).toHaveAttribute(
      'src',
      expect.stringContaining('/images/img-1')
    );
    expect(screen.getByText(/Тип:/)).toBeInTheDocument();
    expect(screen.getByText(/Блок/)).toBeInTheDocument();
    expect(screen.getByText(/Тегло за брой:/)).toBeInTheDocument();
    expect(screen.getByText(/Цена на м²:/)).toBeInTheDocument();
    expect(screen.getByText(/Създаден на:/)).toBeInTheDocument();
    expect(screen.getByText(/15\.01\.2024 10:30/)).toBeInTheDocument();
  });

  it('omits the kind, system and variant fields', async () => {
    renderView();

    await screen.findByRole('heading', { name: 'Wienerberger Porotherm' });
    expect(screen.queryByText(/Система:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Вариант:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Тухли/)).not.toBeInTheDocument();
    expect(screen.queryByText('Системни компоненти')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Скрит компонент' })).not.toBeInTheDocument();
  });

  it('links the create-variant and edit actions', async () => {
    renderView();

    await screen.findByRole('heading', { name: 'Wienerberger Porotherm' });
    expect(screen.getByRole('link', { name: 'Създай вариант' })).toHaveAttribute(
      'href',
      '/internal/products/bricks/new?from=b1'
    );
    expect(screen.getByRole('link', { name: 'Промени' })).toHaveAttribute('href', '/internal/products/b1/edit');
  });

  it('asks for confirmation, deletes, then navigates to the brick list', async () => {
    const user = userEvent.setup();
    server.use(http.delete('*/products/b1', () => new HttpResponse(null, { status: 204 })));

    renderView();
    await user.click(await screen.findByRole('button', { name: 'Изтрий Wienerberger Porotherm' }));

    expect(screen.getByText(/Сигурни ли сте/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Потвърди изтриване на Wienerberger Porotherm' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/products/bricks'));
  });

  it('shows an error inside the dialog when deletion fails', async () => {
    const user = userEvent.setup();
    server.use(http.delete('*/products/b1', () => HttpResponse.json({ message: 'nope' }, { status: 500 })));

    renderView();
    await user.click(await screen.findByRole('button', { name: 'Изтрий Wienerberger Porotherm' }));
    await user.click(screen.getByRole('button', { name: 'Потвърди изтриване на Wienerberger Porotherm' }));

    expect(await screen.findByText('Неуспешно изтриване на продукта.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('labels the variant as Цвят and lists system components for roofs', async () => {
    const roof: Product = {
      _id: 'b1',
      name: 'Тонди Роман',
      kind: 'Покриви',
      system: 'Тонди',
      variant: 'Тъмно кафяво',
      systemComponents: [
        {
          name: 'Начална керемида',
          kind: 'Керемиди',
          rawUnitPrice: 5.5,
          countPerPallet: 240,
          sourceLocation: 'Луковит',
          sapNumber: 'SAP-RC1',
        },
        { name: 'Билен капак', kind: 'Капаци', rawUnitPrice: 3.2 },
      ],
    };
    server.use(http.get('*/products/b1', () => HttpResponse.json(roof, { status: 200 })));

    renderView();

    await screen.findByRole('heading', { name: 'Тонди Роман' });
    expect(screen.getByText(/Система:/)).toBeInTheDocument();
    expect(screen.getByText(/Цвят:/)).toBeInTheDocument();
    expect(screen.queryByText(/Вариант:/)).not.toBeInTheDocument();
    expect(screen.getByText('Системни компоненти')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Начална керемида' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Билен капак' })).toBeInTheDocument();
    expect(screen.getByText(/Керемиди/)).toBeInTheDocument();
    expect(screen.getByText(/SAP номер:/)).toBeInTheDocument();
    expect(screen.getByText(/SAP-RC1/)).toBeInTheDocument();
  });

  it('labels the variant as Вариант and lists system components for pavements', async () => {
    const pavement: Product = {
      _id: 'b1',
      name: 'Семмелрок Умбриано',
      kind: 'Настилки',
      system: 'Умбриано',
      variant: 'Сив',
      systemComponents: [{ name: 'Ограничител', kind: 'Аксесоари', rawUnitPrice: 2.1 }],
    };
    server.use(http.get('*/products/b1', () => HttpResponse.json(pavement, { status: 200 })));

    renderView();

    await screen.findByRole('heading', { name: 'Семмелрок Умбриано' });
    expect(screen.getByText(/Вариант:/)).toBeInTheDocument();
    expect(screen.queryByText(/Цвят:/)).not.toBeInTheDocument();
    expect(screen.getByText('Системни компоненти')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ограничител' })).toBeInTheDocument();
  });
});
