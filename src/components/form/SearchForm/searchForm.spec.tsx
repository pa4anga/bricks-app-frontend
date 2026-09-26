import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Product, Settlement } from '@/api/model';

import { SearchForm } from './SearchForm';
import { useSearchResults } from './searchFormContext';
import type { ICascadeLevel } from './types';

const CASCADE: ICascadeLevel[] = [{ field: 'subtype', label: 'Изберете Категория' }];

const TWO_LEVEL_CASCADE: ICascadeLevel[] = [
  { field: 'subtype', label: 'Изберете Категория' },
  { field: 'system', label: 'Изберете Система' },
];

const products: Product[] = [
  { _id: 'p1', name: 'Тухла 25', subtype: 'Поротон', sourceLocation: 'Лудогорие' },
  { _id: 'p2', name: 'Керемида', subtype: 'Покрив', sourceLocation: 'Марица' },
];

const settlements: Settlement[] = [
  { _id: 's1', name: 'София', distances: [{ source: 'Лудогорие', nearestLocation: 'Русе', distanceKm: 120 }] },
];

describe('SearchForm', () => {
  it('renders the cascade with dependent selects gated until prerequisites are chosen', () => {
    render(
      <SearchForm products={products} settlements={settlements} cascade={CASCADE}>
        <div />
      </SearchForm>
    );

    expect(screen.getByRole('button', { name: /Изберете Категория/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Изберете населено място/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Търсене' })).toBeDisabled();
  });

  it('labels product options by their product name', async () => {
    const productsWithVariant: Product[] = [
      { _id: 'p1', name: 'Тухла 25', variant: 'Естествен', subtype: 'Поротон', sourceLocation: 'Лудогорие' },
    ];

    render(
      <SearchForm products={productsWithVariant} settlements={settlements} cascade={CASCADE}>
        <div />
      </SearchForm>
    );

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Поротон' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Продукт/ }));

    expect(screen.getByRole('button', { name: 'Тухла 25' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Естествен' })).not.toBeInTheDocument();
  });

  it('pools a second cascade level from products matching the first and narrows the product list by both', async () => {
    const pavementProducts: Product[] = [
      { _id: 'p1', name: 'Плоча Сива', subtype: 'Тротоарни', system: 'Сива', sourceLocation: 'Лудогорие' },
      { _id: 'p2', name: 'Плоча Червена', subtype: 'Тротоарни', system: 'Червена', sourceLocation: 'Лудогорие' },
      { _id: 'p3', name: 'Бордюр', subtype: 'Бордюри', system: 'Сива', sourceLocation: 'Марица' },
    ];

    render(
      <SearchForm products={pavementProducts} settlements={settlements} cascade={TWO_LEVEL_CASCADE}>
        <div />
      </SearchForm>
    );

    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));

    const systemButton = screen.getByRole('button', { name: /Изберете Система/ });
    expect(systemButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeDisabled();

    await userEvent.click(systemButton);
    expect(screen.getByRole('button', { name: 'Сива' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Червена' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));

    const productButton = screen.getByRole('button', { name: /Изберете Продукт/ });
    expect(productButton).toBeEnabled();

    await userEvent.click(productButton);
    expect(screen.getByRole('button', { name: 'Плоча Сива' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Плоча Червена' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Бордюр' })).not.toBeInTheDocument();
  });

  it('resets the system and product levels when the category changes', async () => {
    const pavementProducts: Product[] = [
      { _id: 'p1', name: 'Плоча Сива', subtype: 'Тротоарни', system: 'Сива', sourceLocation: 'Лудогорие' },
      { _id: 'p2', name: 'Бордюр', subtype: 'Бордюри', system: 'Гранит', sourceLocation: 'Марица' },
    ];

    render(
      <SearchForm products={pavementProducts} settlements={settlements} cascade={TWO_LEVEL_CASCADE}>
        <div />
      </SearchForm>
    );

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));

    expect(screen.getByRole('button', { name: /Сива/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Тротоарни/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Бордюри' }));

    expect(screen.getByRole('button', { name: /Изберете Система/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Изберете Продукт/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Сива/ })).not.toBeInTheDocument();
  });

  it('uses the configured product label and title for the terminal select', async () => {
    const pavementProducts: Product[] = [
      {
        _id: 'p1',
        name: 'Плоча Сива',
        variant: 'Пясъчен',
        subtype: 'Тротоарни',
        system: 'Сива',
        sourceLocation: 'Лудогорие',
      },
      {
        _id: 'p2',
        name: 'Плоча Ретро',
        variant: 'Теракота',
        subtype: 'Тротоарни',
        system: 'Червена',
        sourceLocation: 'Лудогорие',
      },
    ];

    render(
      <SearchForm
        products={pavementProducts}
        settlements={settlements}
        cascade={TWO_LEVEL_CASCADE}
        productLabel="Изберете Цвят"
        getProductLabel={product => product.variant ?? ''}
      >
        <div />
      </SearchForm>
    );

    await userEvent.click(screen.getByRole('button', { name: /Изберете Категория/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Тротоарни' }));
    await userEvent.click(screen.getByRole('button', { name: /Изберете Система/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сива' }));

    const colourButton = screen.getByRole('button', { name: /Изберете Цвят/ });
    expect(colourButton).toBeEnabled();

    await userEvent.click(colourButton);
    expect(screen.getByRole('button', { name: 'Пясъчен' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Плоча Сива' })).not.toBeInTheDocument();
  });

  it('throws when useSearchResults is used outside of a SearchForm provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSearchResults())).toThrow('useSearchResults must be used within a <SearchForm>.');

    errorSpy.mockRestore();
  });
});
