import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Product, ProductPricing } from '@/api/model';

import { ProductInfo } from './ProductInfo';

const sampleProductWithImage: Product = {
  _id: 'p1',
  name: 'Тухла 25',
  kind: 'Керамични блокове',
  countPerPallet: 300,
  imageId: 'image-123',
};

const sampleProductWithoutImage: Product = {
  _id: 'p2',
  name: 'Керемида',
  kind: 'Покривни системи',
  system: undefined,
  imageId: undefined,
};

const samplePavementProduct: Product = {
  _id: 'p3',
  name: 'Настилка Тон',
  kind: 'Настилки',
  iconLoad: '3.5t',
  countPerPallet: 100,
  imageId: undefined,
};

const samplePricing: ProductPricing = {
  pricePerUnit: 1.06,
  pricePerSquareMeter: 13.23,
  nearestLocation: 'Русе',
  distanceKm: 120,
  systemComponents: [],
};

const samplePricingWithoutM2: ProductPricing = {
  pricePerUnit: 1.06,
  pricePerSquareMeter: undefined,
  nearestLocation: 'Русе',
  distanceKm: 120,
  systemComponents: [],
};

const samplePricingOnlyM2: ProductPricing = {
  pricePerUnit: undefined,
  pricePerSquareMeter: 13.23,
  nearestLocation: 'Русе',
  distanceKm: 120,
  systemComponents: [],
};

const sampleSettlementName = 'София';

describe('ProductInfo', () => {
  it('renders product.name as a heading', () => {
    render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.getByRole('heading', { name: 'Тухла 25' })).toBeInTheDocument();
  });

  it('renders a present spec field and omits a field whose value is undefined', () => {
    const { rerender } = render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.getByText(/Брой в палет:/)).toBeInTheDocument();
    expect(screen.getByText(/300/)).toBeInTheDocument();

    rerender(
      <ProductInfo product={sampleProductWithoutImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.queryByText(/Брой в палет:/)).not.toBeInTheDocument();
  });

  it('rounds non-price numeric spec values to three decimals when they have more than three', () => {
    render(
      <ProductInfo
        product={{ ...sampleProductWithImage, unitWeightKg: 3.45678 }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText(/Тегло за брой:/)).toBeInTheDocument();
    expect(screen.getByText(/3\.457 кг/)).toBeInTheDocument();
  });

  it('leaves numeric spec values with three or fewer decimals unchanged', () => {
    render(
      <ProductInfo
        product={{ ...sampleProductWithImage, unitWeightKg: 3.45 }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText(/3\.45 кг/)).toBeInTheDocument();
  });

  it('renders the pavements-only iconLoad spec and hides it for other kinds', () => {
    const { rerender } = render(
      <ProductInfo product={samplePavementProduct} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.getByText(/Икона \(Натоварване\):/)).toBeInTheDocument();
    expect(screen.getByText(/3\.5t/)).toBeInTheDocument();

    rerender(
      <ProductInfo
        product={{ ...sampleProductWithImage, iconLoad: '3.5t' }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.queryByText(/Икона \(Натоварване\):/)).not.toBeInTheDocument();
  });

  it('renders the endpoint prices with a " €" suffix', () => {
    render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.getByText(/1\.06 €/)).toBeInTheDocument();
    expect(screen.getByText(/13\.23 €/)).toBeInTheDocument();
  });

  it('omits price per square meter if it is absent in pricing', () => {
    render(
      <ProductInfo
        product={sampleProductWithImage}
        pricing={samplePricingWithoutM2}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText(/1\.06 €/)).toBeInTheDocument();
    expect(screen.queryByText(/Цена за 1 м²/)).not.toBeInTheDocument();
  });

  it('omits price per unit and shows only the square-meter price when the unit price is absent', () => {
    render(
      <ProductInfo
        product={sampleProductWithImage}
        pricing={samplePricingOnlyM2}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText(/13\.23 €/)).toBeInTheDocument();
    expect(screen.getByText(/Цена за 1 м²/)).toBeInTheDocument();
    expect(screen.queryByText(/Цена за 1 брой/)).not.toBeInTheDocument();
  });

  it('renders an img with the correct alt when imageId is set, and no img when imageId is absent', () => {
    const { rerender } = render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Тухла 25');
    expect(img.getAttribute('src')).toMatch(/\/images\/image-123$/);

    rerender(
      <ProductInfo product={sampleProductWithoutImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the settlement name with the distance from the nearest location', () => {
    render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.getByText(/София\(на 120 км от Русе\)/)).toBeInTheDocument();
  });

  it('renders the validity date under the location caption', () => {
    render(
      <ProductInfo
        product={sampleProductWithImage}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
        issuedAt={new Date(2026, 8, 6)}
      />
    );
    expect(screen.getByText('Дата на валидност: 06-09-2026')).toBeInTheDocument();
  });

  it('renders the product comment at the bottom of the card when present', () => {
    render(
      <ProductInfo
        product={{ ...sampleProductWithImage, comment: 'Специална поръчка' }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText('Специална поръчка')).toBeInTheDocument();
  });

  it('omits the comment when it is an empty string or missing', () => {
    const { rerender } = render(
      <ProductInfo
        product={{ ...sampleProductWithImage, comment: 'Специална поръчка' }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText('Специална поръчка')).toBeInTheDocument();

    rerender(
      <ProductInfo
        product={{ ...sampleProductWithImage, comment: '' }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.queryByText('Специална поръчка')).not.toBeInTheDocument();

    rerender(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );
    expect(screen.queryByText('Специална поръчка')).not.toBeInTheDocument();
  });

  it('renders variant and sapNumber as a subtitle under the title, not as spec items', () => {
    render(
      <ProductInfo
        product={{ ...sampleProductWithImage, variant: 'Естествен', sapNumber: '437212000000' }}
        pricing={samplePricing}
        settlementName={sampleSettlementName}
      />
    );
    expect(screen.getByText('вариант: Естествен, код: 437212000000')).toBeInTheDocument();
    expect(screen.queryByText(/Вариант:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Код:/)).not.toBeInTheDocument();
  });

  it('renders the delivery and minimum-order footnotes under the card', () => {
    render(
      <ProductInfo product={sampleProductWithImage} pricing={samplePricing} settlementName={sampleSettlementName} />
    );

    expect(screen.getByText(/се поддържат на склад/)).toBeInTheDocument();
    expect(screen.getByText(/цената се завишава с 10%/)).toBeInTheDocument();
  });
});
