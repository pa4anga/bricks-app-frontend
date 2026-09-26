import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { API_BASE_URL } from '@/api/axiosInstance';
import { useDeleteProductsId, useGetProductsId } from '@/api/endpoints/products/products';
import type { Product } from '@/api/model';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { getProductKindByKind } from '@/constants/productKinds';
import {
  INTERNAL_PRODUCTS_ROUTE,
  INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE,
  INTERNAL_PRODUCT_EDIT_ROUTE,
  INTERNAL_PRODUCT_LIST_ROUTE,
} from '@/constants/routes';

import { SystemComponentCard } from './SystemComponentCard';

import styles from './productView.module.scss';

const LOAD_FAILED_MESSAGE = 'Неуспешно зареждане на продукта.';
const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на продукта.';

interface IProductField {
  key: keyof Product;
  label: string;
  suffix?: string;
  format?: 'datetime';
}

const PRODUCT_FIELDS: IProductField[] = [
  { key: 'subtype', label: 'Тип' },
  { key: 'system', label: 'Система' },
  { key: 'variant', label: 'Вариант' },
  { key: 'rawUnitPrice', label: 'Единична цена' },
  { key: 'countPerPallet', label: 'Брой в палет' },
  { key: 'minimumOrderUnits', label: 'Минимално количество' },
  { key: 'unitsPerSquareMeter', label: 'Брой на м²' },
  { key: 'unitWeightKg', label: 'Тегло за брой', suffix: ' кг' },
  { key: 'palletWeightKg', label: 'Тегло на палет', suffix: ' кг' },
  { key: 'weightPerSquareMeter', label: 'Тегло на м²', suffix: ' кг' },
  { key: 'pricePerSquareMeter', label: 'Цена на м²' },
  { key: 'rasterSize', label: 'Размер' },
  { key: 'classification', label: 'Клас на доставка' },
  { key: 'productionSource', label: 'Произход' },
  { key: 'sourceLocation', label: 'Производствена база' },
  { key: 'feeCategory', label: 'Категория надценка' },
  { key: 'sapNumber', label: 'SAP номер' },
  { key: 'comment', label: 'Коментар' },
  { key: 'createdAt', label: 'Създаден на', format: 'datetime' },
  { key: 'updatedAt', label: 'Обновен на', format: 'datetime' },
];

const ALWAYS_HIDDEN_KEYS: (keyof Product)[] = ['kind'];

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (input: number) => String(input).padStart(2, '0');

  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}`;
};

const formatFieldValue = (value: unknown, field: IProductField): string => {
  const text = String(value);

  if (field.format === 'datetime') {
    return formatDateTime(text);
  }

  return `${text}${field.suffix ?? ''}`;
};

export const ProductView = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const { data: product, error, isLoading } = useGetProductsId(id);
  const { trigger: deleteProduct, isMutating } = useDeleteProductsId(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const productKind = getProductKindByKind(product?.kind);
  const variantLabel = productKind?.variantLabel ?? 'Вариант';

  const hiddenKeys = new Set<keyof Product>(ALWAYS_HIDDEN_KEYS);
  if (!productKind?.showSystem) {
    hiddenKeys.add('system');
  }
  if (!productKind?.showVariant) {
    hiddenKeys.add('variant');
  }

  const closeConfirm = () => {
    if (!isMutating) {
      setConfirmOpen(false);
      setDeleteFailed(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteFailed(false);

    try {
      await deleteProduct();
      setConfirmOpen(false);
      await router.push(productKind ? INTERNAL_PRODUCT_LIST_ROUTE(productKind.slug) : INTERNAL_PRODUCTS_ROUTE);
    } catch {
      setDeleteFailed(true);
    }
  };

  const renderContent = () => {
    if (!router.isReady || isLoading) {
      return <CircularProgress aria-label="Зареждане на продукта" />;
    }

    if (error || !product) {
      return <Alert severity="error">{LOAD_FAILED_MESSAGE}</Alert>;
    }

    const name = product.name ?? '';
    const imageUrl = product.imageId ? `${API_BASE_URL}/images/${product.imageId}` : '';

    return (
      <>
        <div className={styles.card}>
          {imageUrl ? (
            <div className={styles.imageWrapper}>
              <Box component="img" src={imageUrl} alt={name} />
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>Няма изображение</div>
          )}

          <div className={styles.details}>
            {name && (
              <Typography component="h2" className={styles.title}>
                {name}
              </Typography>
            )}

            <div className={styles.specList}>
              {PRODUCT_FIELDS.filter(field => !hiddenKeys.has(field.key)).map(field => {
                const value: unknown = product[field.key];

                if (value === null || value === undefined || value === '') {
                  return null;
                }

                const label = field.key === 'variant' ? variantLabel : field.label;

                return (
                  <Typography key={field.key} className={styles.specItem}>
                    <strong>{label}:</strong> {formatFieldValue(value, field)}
                  </Typography>
                );
              })}
            </div>
          </div>
        </div>

        {productKind?.showSystem && product.systemComponents && product.systemComponents.length > 0 && (
          <section className={styles.componentsSection}>
            <Typography component="h3" className={styles.componentsHeading}>
              Системни компоненти
            </Typography>
            <Stack spacing={2}>
              {product.systemComponents.map((component, index) => (
                <SystemComponentCard key={index} component={component} />
              ))}
            </Stack>
          </section>
        )}

        <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 3, flexWrap: 'wrap' }}>
          {productKind && (
            <Button
              variant="contained"
              component={Link}
              href={INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE(productKind.slug, product._id ?? '')}
            >
              Създай вариант
            </Button>
          )}
          <Button variant="outlined" component={Link} href={INTERNAL_PRODUCT_EDIT_ROUTE(product._id ?? '')}>
            Промени
          </Button>
          <Button
            variant="outlined"
            color="error"
            aria-label={`Изтрий ${name}`}
            onClick={() => {
              setDeleteFailed(false);
              setConfirmOpen(true);
            }}
          >
            Изтрий
          </Button>
        </Stack>

        <Dialog open={confirmOpen} onClose={closeConfirm}>
          <DialogTitle>Изтриване на продукт</DialogTitle>
          <DialogContent>
            <DialogContentText>Сигурни ли сте, че искате да изтриете „{name}“?</DialogContentText>
            {deleteFailed && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {DELETE_FAILED_MESSAGE}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirm} disabled={isMutating}>
              Не
            </Button>
            <Button
              color="error"
              disabled={isMutating}
              aria-label={`Потвърди изтриване на ${name}`}
              onClick={() => {
                void confirmDelete();
              }}
            >
              Да
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

  return (
    <PageTemplate title="Преглед на продукт" heading="Преглед на продукт" internal>
      {renderContent()}
    </PageTemplate>
  );
};
