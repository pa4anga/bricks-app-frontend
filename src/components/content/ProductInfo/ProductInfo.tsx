import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import {
  applyTemplate,
  buildSubtitle,
  formatDate,
  formatEuro,
  formatValue,
  getFieldDescriptors,
  getImageUrl,
} from './productFields';
import type { IProductInfoProps } from './types';

import styles from './productInfo.module.scss';

const DELIVERY_FOOTNOTE =
  '* Продукти от група А и B се поддържат на склад, при липса на наличност са със срок на производство/доставка до 8 седмици. Продукти от група C се произвеждат/доставят при получена поръчка от Ваша страна, при липса на наличност са със срок на производство/ доставка до 12 седмици.';

const MIN_ORDER_FOOTNOTE =
  '** При поръчка на количество по-малко или повече над кратно на минималнотото количество, цената се завишава с 10%. По-високата цена се калкулира само за количеството над кратното на минималното количество.';

export const ProductInfo = ({ product, pricing, settlementName, issuedAt }: IProductInfoProps) => {
  const imageUrl = getImageUrl(product.imageId);
  const subtitle = buildSubtitle(product);
  const validityDate = formatDate(issuedAt ?? new Date());
  const comment = formatValue(product.comment);

  return (
    <>
      <div className={styles.card}>
        {product.imageId && imageUrl ? (
          <div className={styles.imageWrapper}>
            <Box component="img" src={imageUrl} alt={product.name ?? ''} />
          </div>
        ) : null}

        <div className={styles.content}>
          <div className={styles.middleColumn}>
            <div className={styles.titleBox}>
              {product.name && (
                <Typography component="h1" className={styles.title}>
                  {product.name}
                </Typography>
              )}
              {subtitle && <Typography className={styles.subtitle}>{subtitle}</Typography>}
            </div>

            <div className={styles.specList}>
              {getFieldDescriptors(product).map(({ key, label, template }) => {
                const val = product[key];
                const formatted = formatValue(val);
                if (!formatted) return null;
                return (
                  <Typography key={key} className={styles.specItem}>
                    <strong>{label}:</strong> {applyTemplate(template, formatted)}
                  </Typography>
                );
              })}
            </div>
          </div>

          <div className={styles.rightColumn}>
            {pricing.pricePerUnit !== undefined && pricing.pricePerUnit !== null && (
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Цена за 1 брой (с ДДС):</span>
                <span className={styles.priceValue}>{formatEuro(pricing.pricePerUnit)}</span>
              </div>
            )}

            {pricing.pricePerSquareMeter !== undefined && pricing.pricePerSquareMeter !== null && (
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Цена за 1 м² (с ДДС):</span>
                <span className={styles.priceValue}>{formatEuro(pricing.pricePerSquareMeter)}</span>
              </div>
            )}

            <div className={styles.locationCaption}>
              {settlementName}
              <br />
              (на {formatValue(pricing.distanceKm)} км от {pricing.nearestLocation})
            </div>

            <div className={styles.validityDate}>Дата на валидност: {validityDate}</div>
          </div>

          {comment && <div className={styles.comment}>{comment}</div>}
        </div>
      </div>

      <div className={styles.footnotes}>
        <p className={styles.footnote}>{DELIVERY_FOOTNOTE}</p>
        <p className={styles.footnote}>{MIN_ORDER_FOOTNOTE}</p>
      </div>
    </>
  );
};
