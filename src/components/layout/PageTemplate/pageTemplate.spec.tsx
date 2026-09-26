import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageTemplate } from '@/components/layout/PageTemplate';

const renderTemplate = () =>
  render(
    <PageTemplate>
      <p>content</p>
    </PageTemplate>
  );

describe('PageTemplate', () => {
  it('links the logo to our own home page and keeps the navbar off public pages', () => {
    renderTemplate();

    expect(screen.getByRole('link', { name: 'Начало' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Продукти' })).not.toBeInTheDocument();
  });

  it('points the cloned pages at our internal routes', () => {
    renderTemplate();

    expect(screen.getByRole('link', { name: 'Общи условия' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Импресум' })).toHaveAttribute('href', '/impresum');
    expect(screen.getByRole('link', { name: 'Бисквитки' })).toHaveAttribute('href', '/cookies');
  });

  it('keeps the other links pointing at the original external targets', () => {
    renderTemplate();

    const dataProtection = screen.getByRole('link', { name: 'Защита на личните данни' });
    expect(dataProtection).toHaveAttribute('href', 'https://wienerberger.bg/zashtita-lichni-danni');
    expect(dataProtection).toHaveAttribute('target', '_blank');

    expect(screen.getByRole('link', { name: 'Wienerberger.com' })).toHaveAttribute('href', 'https://wienerberger.com/');
  });

  it('shows the navigation instead of the footer on internal pages', () => {
    render(
      <PageTemplate internal>
        <p>content</p>
      </PageTemplate>
    );

    expect(screen.getByRole('button', { name: 'Настройки' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Общи условия' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Wienerberger.com' })).not.toBeInTheDocument();
  });

  it('renders neither the navbar nor the footer on bare pages', () => {
    render(
      <PageTemplate bare>
        <p>content</p>
      </PageTemplate>
    );

    expect(screen.getByRole('link', { name: 'Начало' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Продукти' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Wienerberger.com' })).not.toBeInTheDocument();
  });
});
