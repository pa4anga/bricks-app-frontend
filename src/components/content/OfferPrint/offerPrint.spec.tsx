import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Product, ProductPricing } from '@/api/model';

import { OfferPrint } from './OfferPrint';

const product: Product = {
  _id: 'p1',
  name: 'Traditon 12 Основна керемида',
  variant: 'Естествен',
  sapNumber: '437212000000',
  system: 'Поротон',
  rasterSize: '25,5 х 43,5',
  countPerPallet: 300,
  imageId: 'image-123',
};

const pavementProduct: Product = {
  _id: 'p2',
  name: 'Настилка Тон',
  kind: 'Настилки',
  iconLoad: '3.5t',
  countPerPallet: 300,
  imageId: 'image-123',
};

const pricing: ProductPricing = {
  pricePerUnit: 1.06,
  pricePerSquareMeter: 13.23,
  nearestLocation: 'Попово',
  distanceKm: 12,
  systemComponents: [],
};

const pricingWithoutM2: ProductPricing = {
  pricePerUnit: 1.06,
  pricePerSquareMeter: undefined,
  nearestLocation: 'Попово',
  distanceKm: 12,
  systemComponents: [],
};

const pricingOnlyM2: ProductPricing = {
  pricePerUnit: undefined,
  pricePerSquareMeter: 13.23,
  nearestLocation: 'Попово',
  distanceKm: 12,
  systemComponents: [],
};

describe('OfferPrint', () => {
  it('renders the product name as a heading with the variant/code row directly under it', () => {
    render(<OfferPrint product={product} pricing={pricing} settlementName="Баба Тонка" />);

    expect(screen.getByRole('heading', { name: 'Traditon 12 Основна керемида', hidden: true })).toBeInTheDocument();
    expect(screen.getByText('вариант: Естествен, код: 437212000000')).toBeInTheDocument();
  });

  it('renders the ProductInfo spec fields as bullet items and never as variant/code labels', () => {
    render(<OfferPrint product={product} pricing={pricing} settlementName="Баба Тонка" />);

    expect(screen.getByText(/Брой в палет:/)).toBeInTheDocument();
    expect(screen.getByText(/Размер:/)).toBeInTheDocument();
    expect(screen.queryByText(/Вариант:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Код:/)).not.toBeInTheDocument();
  });

  it('renders the pavements-only iconLoad bullet for pavement products', () => {
    render(<OfferPrint product={pavementProduct} pricing={pricing} settlementName="Баба Тонка" />);

    expect(screen.getByText(/Икона \(Натоварване\): 3\.5t/)).toBeInTheDocument();
  });

  it('omits the iconLoad bullet for non-pavement products', () => {
    render(<OfferPrint product={{ ...product, iconLoad: '3.5t' }} pricing={pricing} settlementName="Баба Тонка" />);

    expect(screen.queryByText(/Икона \(Натоварване\):/)).not.toBeInTheDocument();
  });

  it('renders euro prices with their labels', () => {
    render(<OfferPrint product={product} pricing={pricing} settlementName="Баба Тонка" />);

    expect(screen.getByText('Цена за 1 брой (с ДДС):')).toBeInTheDocument();
    expect(screen.getByText('1.06 €')).toBeInTheDocument();
    expect(screen.getByText('Цена за 1 м² (с ДДС):')).toBeInTheDocument();
    expect(screen.getByText('13.23 €')).toBeInTheDocument();
  });

  it('omits the price per square meter when it is absent', () => {
    render(<OfferPrint product={product} pricing={pricingWithoutM2} settlementName="Баба Тонка" />);

    expect(screen.getByText('1.06 €')).toBeInTheDocument();
    expect(screen.queryByText('Цена за 1 м² (с ДДС):')).not.toBeInTheDocument();
  });

  it('omits the price per unit and shows only the square-meter price when the unit price is absent', () => {
    render(<OfferPrint product={product} pricing={pricingOnlyM2} settlementName="Баба Тонка" />);

    expect(screen.getByText('13.23 €')).toBeInTheDocument();
    expect(screen.getByText('Цена за 1 м² (с ДДС):')).toBeInTheDocument();
    expect(screen.queryByText('Цена за 1 брой (с ДДС):')).not.toBeInTheDocument();
  });

  it('renders the delivery footer and a formatted validity date', () => {
    render(
      <OfferPrint product={product} pricing={pricing} settlementName="Баба Тонка" issuedAt={new Date(2026, 8, 6)} />
    );

    expect(screen.getByText('Офертата е валидна за доставка до Баба Тонка (на 12 км от Попово)')).toBeInTheDocument();
    expect(screen.getByText('Дата на валидност: 06-09-2026')).toBeInTheDocument();
  });

  it('renders the Wienerberger logo and activates print mode on the document element', () => {
    render(<OfferPrint product={product} pricing={pricing} settlementName="Баба Тонка" />);

    const logo = screen.getByAltText('Wienerberger');
    expect(logo).toHaveAttribute('src', '/img/wienerberger_logo.svg');
    expect(document.documentElement).toHaveClass('offerPrintActive');
  });
});
