import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  applyTemplate,
  buildSubtitle,
  formatDate,
  formatEuro,
  formatValue,
  getFieldDescriptors,
  getImageUrl,
} from '@/components/content/ProductInfo/productFields';

import type { IOfferPrintProps } from './types';

import styles from './offerPrint.module.scss';

const PRINT_ACTIVE_CLASS = 'offerPrintActive';

export const OfferPrint = ({ product, pricing, settlementName, issuedAt }: IOfferPrintProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add(PRINT_ACTIVE_CLASS);
    return () => {
      document.documentElement.classList.remove(PRINT_ACTIVE_CLASS);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const imageUrl = getImageUrl(product.imageId);
  const subtitle = buildSubtitle(product);
  const validityDate = formatDate(issuedAt ?? new Date());
  const deliveryLine = `Офертата е валидна за доставка до ${settlementName} (на ${formatValue(pricing.distanceKm)} км от ${pricing.nearestLocation})`;

  return createPortal(
    <div className={styles.offer} aria-hidden="true">
      <div className={styles.logoRow}>
        <img src="/img/wienerberger_logo.svg" alt="Wienerberger" className={styles.logo} />
      </div>

      <hr className={styles.rule} />

      <header>
        {product.name && <h1 className={styles.title}>{product.name}</h1>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      <hr className={styles.rule} />

      <div className={styles.body}>
        {product.imageId && imageUrl ? (
          <div className={styles.imageCol}>
            <img src={imageUrl} alt={product.name ?? ''} className={styles.image} />
          </div>
        ) : null}

        <ul className={styles.specs}>
          {getFieldDescriptors(product).map(({ key, label, template }) => {
            const formatted = formatValue(product[key]);
            if (!formatted) return null;
            return (
              <li key={key} className={styles.specItem}>
                {`${label}: ${applyTemplate(template, formatted)}`}
              </li>
            );
          })}
        </ul>

        <div className={styles.prices}>
          {pricing.pricePerUnit !== undefined && pricing.pricePerUnit !== null && (
            <>
              <p className={styles.priceLabel}>Цена за 1 брой (с ДДС):</p>
              <p className={styles.priceValue}>{formatEuro(pricing.pricePerUnit)}</p>
            </>
          )}

          {pricing.pricePerSquareMeter !== undefined && pricing.pricePerSquareMeter !== null && (
            <>
              <p className={styles.priceLabel}>Цена за 1 м² (с ДДС):</p>
              <p className={styles.priceValue}>{formatEuro(pricing.pricePerSquareMeter)}</p>
            </>
          )}
        </div>
      </div>

      <hr className={styles.rule} />

      <footer className={styles.foot}>
        <p>{deliveryLine}</p>
        <p>{`Дата на валидност: ${validityDate}`}</p>
      </footer>
    </div>,
    document.body
  );
};
