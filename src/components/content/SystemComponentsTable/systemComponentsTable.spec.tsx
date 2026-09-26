import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SystemComponentsTable } from './SystemComponentsTable';
import type { ISystemComponentGroup } from './types';

const groups: ISystemComponentGroup[] = [
  {
    label: 'Основна керемида',
    rows: [{ label: 'Contiton 12 (цвят: Тъмно-кафяв)', pricePerUnit: '2.23 €', pricePerSquareMeter: '13.40 €' }],
  },
  {
    label: 'Помощни керемиди',
    rows: [{ label: 'Крайна дясна керемида (цвят: Тъмно-кафяв)', pricePerUnit: '10.80 €' }],
  },
];

describe('SystemComponentsTable', () => {
  it('renders the Продукт header plus both price columns when values are present', () => {
    render(<SystemComponentsTable groups={groups} />);

    expect(screen.getByText('Продукт')).toBeInTheDocument();
    expect(screen.getByText('Цена за брой')).toBeInTheDocument();
    expect(screen.getByText('Цена за м²')).toBeInTheDocument();
  });

  it('renders each group label and its rows with both prices', () => {
    render(<SystemComponentsTable groups={groups} />);

    expect(screen.getByText('Основна керемида')).toBeInTheDocument();
    expect(screen.getByText('Помощни керемиди')).toBeInTheDocument();
    expect(screen.getByText('Contiton 12 (цвят: Тъмно-кафяв)')).toBeInTheDocument();
    expect(screen.getByText('2.23 €')).toBeInTheDocument();
    expect(screen.getByText('13.40 €')).toBeInTheDocument();
    expect(screen.getByText('Крайна дясна керемида (цвят: Тъмно-кафяв)')).toBeInTheDocument();
    expect(screen.getByText('10.80 €')).toBeInTheDocument();
  });

  it('shows a dash for a row that is missing one of the prices', () => {
    render(<SystemComponentsTable groups={groups} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('hides the square-meter column entirely when no row has a square-meter price', () => {
    const unitOnly: ISystemComponentGroup[] = [
      { label: 'Основна керемида', rows: [{ label: 'Contiton 12', pricePerUnit: '2.23 €' }] },
    ];

    render(<SystemComponentsTable groups={unitOnly} />);

    expect(screen.getByText('Цена за брой')).toBeInTheDocument();
    expect(screen.queryByText('Цена за м²')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('hides the unit column entirely when no row has a unit price', () => {
    const squareMeterOnly: ISystemComponentGroup[] = [
      { label: 'Основна керемида', rows: [{ label: 'Contiton 12', pricePerSquareMeter: '13.40 €' }] },
    ];

    render(<SystemComponentsTable groups={squareMeterOnly} />);

    expect(screen.getByText('Цена за м²')).toBeInTheDocument();
    expect(screen.queryByText('Цена за брой')).not.toBeInTheDocument();
  });
});
