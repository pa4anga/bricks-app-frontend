import { describe, expect, it } from 'vitest';

import type { Product, ProductPricing } from '@/api/model';

import { buildSystemComponentGroups, formatRowLabel, getPriceColumnVisibility } from './systemComponentRows';
import type { ISystemComponentGroup } from './types';

describe('formatRowLabel', () => {
  it('appends the colour in parentheses for roof tiles (Покриви)', () => {
    expect(formatRowLabel('Основна керемида', 'Тъмно-кафяв', 'Покриви')).toBe('Основна керемида (цвят: Тъмно-кафяв)');
  });

  it('appends the variant after a space for other kinds', () => {
    expect(formatRowLabel('Плоча', 'Пясъчен', 'Настилки')).toBe('Плоча Пясъчен');
  });

  it('returns just the name when there is no variant', () => {
    expect(formatRowLabel('Плоча', undefined, 'Настилки')).toBe('Плоча');
  });
});

describe('buildSystemComponentGroups', () => {
  const product: Product = {
    _id: 'p1',
    name: 'Contiton 12',
    kind: 'Покриви',
    variant: 'Тъмно-кафяв',
    subtype: 'Основна керемида',
    systemComponents: [
      { name: 'Крайна дясна керемида', kind: 'Помощни керемиди' },
      { name: 'Крайна лява керемида', kind: 'Помощни керемиди' },
      { name: 'Четворник', kind: 'Керамични аксесоари' },
    ],
  };

  const pricing: ProductPricing = {
    pricePerUnit: 2.23,
    nearestLocation: 'Русе',
    distanceKm: 120,
    systemComponents: [
      { name: 'Крайна дясна керемида', pricePerUnit: 10.8, nearestLocation: 'Русе', distanceKm: 120 },
      { name: 'Крайна лява керемида', pricePerUnit: 10.8, nearestLocation: 'Русе', distanceKm: 120 },
    ],
  };

  it('groups the product under its subtype and components under their kind, preserving order', () => {
    const groups = buildSystemComponentGroups(product, pricing);

    expect(groups.map(group => group.label)).toEqual(['Основна керемида', 'Помощни керемиди', 'Керамични аксесоари']);
  });

  it('puts the product as the first row of its subtype group with its unit price', () => {
    const groups = buildSystemComponentGroups(product, pricing);

    expect(groups[0].rows).toEqual([{ label: 'Contiton 12 (цвят: Тъмно-кафяв)', pricePerUnit: '2.23 €' }]);
  });

  it('labels components with the product colour and matches their price by name', () => {
    const groups = buildSystemComponentGroups(product, pricing);

    expect(groups[1].rows).toEqual([
      { label: 'Крайна дясна керемида (цвят: Тъмно-кафяв)', pricePerUnit: '10.80 €' },
      { label: 'Крайна лява керемида (цвят: Тъмно-кафяв)', pricePerUnit: '10.80 €' },
    ]);
  });

  it('leaves both prices undefined when a component has no matching pricing entry', () => {
    const groups = buildSystemComponentGroups(product, pricing);

    expect(groups[2].rows).toEqual([{ label: 'Четворник (цвят: Тъмно-кафяв)' }]);
  });

  it('carries pricePerSquareMeter for the product and components when present', () => {
    const pricingWithM2: ProductPricing = {
      pricePerUnit: 2.23,
      pricePerSquareMeter: 13.4,
      nearestLocation: 'Русе',
      distanceKm: 120,
      systemComponents: [
        { name: 'Крайна дясна керемида', pricePerSquareMeter: 55, nearestLocation: 'Русе', distanceKm: 120 },
      ],
    };

    const groups = buildSystemComponentGroups(product, pricingWithM2);

    expect(groups[0].rows[0]).toEqual({
      label: 'Contiton 12 (цвят: Тъмно-кафяв)',
      pricePerUnit: '2.23 €',
      pricePerSquareMeter: '13.40 €',
    });
    expect(groups[1].rows[0].pricePerSquareMeter).toBe('55.00 €');
    expect(groups[1].rows[0].pricePerUnit).toBeUndefined();
  });

  it('falls back to space-joined labels for non-roof kinds', () => {
    const pavement: Product = {
      _id: 'p2',
      name: 'Плоча',
      kind: 'Настилки',
      variant: 'Пясъчен',
      subtype: 'Тротоарни',
      systemComponents: [{ name: 'Бордюр', kind: 'Аксесоари' }],
    };
    const pavementPricing: ProductPricing = {
      pricePerUnit: 5,
      nearestLocation: 'Русе',
      distanceKm: 10,
      systemComponents: [{ name: 'Бордюр', pricePerUnit: 3, nearestLocation: 'Русе', distanceKm: 10 }],
    };

    const groups = buildSystemComponentGroups(pavement, pavementPricing);

    expect(groups[0].rows[0].label).toBe('Плоча Пясъчен');
    expect(groups[1].rows[0].label).toBe('Бордюр Пясъчен');
  });
});

describe('getPriceColumnVisibility', () => {
  it('shows only the unit column when no row has a square-meter price', () => {
    const groups: ISystemComponentGroup[] = [
      { label: 'g', rows: [{ label: 'a', pricePerUnit: '1.00 €' }, { label: 'b' }] },
    ];

    expect(getPriceColumnVisibility(groups)).toEqual({ showPricePerUnit: true, showPricePerSquareMeter: false });
  });

  it('flags both columns when the two prices appear across different rows', () => {
    const groups: ISystemComponentGroup[] = [
      {
        label: 'g',
        rows: [
          { label: 'a', pricePerUnit: '1.00 €' },
          { label: 'b', pricePerSquareMeter: '2.00 €' },
        ],
      },
    ];

    expect(getPriceColumnVisibility(groups)).toEqual({ showPricePerUnit: true, showPricePerSquareMeter: true });
  });

  it('hides both columns when no row has any price', () => {
    const groups: ISystemComponentGroup[] = [{ label: 'g', rows: [{ label: 'a' }] }];

    expect(getPriceColumnVisibility(groups)).toEqual({ showPricePerUnit: false, showPricePerSquareMeter: false });
  });
});
