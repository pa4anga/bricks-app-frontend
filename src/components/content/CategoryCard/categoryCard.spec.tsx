import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CategoryCard } from './CategoryCard';

describe('CategoryCard', () => {
  it('renders a link to href labelled by the title', () => {
    render(<CategoryCard title="Тухли" href="/prices/bricks" imageSrc="/img/categories/placeholder.svg" />);
    const link = screen.getByRole('link', { name: 'Тухли' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/prices/bricks');
  });

  it('renders the image source', () => {
    render(
      <CategoryCard
        title="Тухли"
        href="/prices/bricks"
        imageSrc="/img/categories/placeholder.svg"
        imageAlt="Тухли изображение"
      />
    );
    const img = screen.getByRole('img', { name: 'Тухли изображение' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/img/categories/placeholder.svg');
  });
});
