import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Продукти" value={42} isLoading={false} />);

    expect(screen.getByRole('heading', { name: 'Продукти' })).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows a loading placeholder instead of a value while loading', () => {
    render(<StatCard label="Продукти" value={undefined} isLoading />);

    expect(screen.getByLabelText('Зареждане')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('renders a dash when the value failed to load', () => {
    render(<StatCard label="Продукти" value={undefined} isLoading={false} isError />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
