import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { useGetProductsId, useGetProductsIdPrice } from '@/api/endpoints/products/products';
import { PageTemplate, SystemComponentsPrint, SystemComponentsTable, buildSystemComponentGroups } from '@/components';
import { buildCatalogRestoreHref } from '@/helpers/priceRoutes';

const openPrintDialog = () => window.print();

const SystemComponentsPage: NextPage = () => {
  const router = useRouter();
  const productId = typeof router.query.product === 'string' ? router.query.product : '';
  const settlement = typeof router.query.settlement === 'string' ? router.query.settlement : '';

  const {
    data: product,
    error: productError,
    isLoading: productLoading,
  } = useGetProductsId(productId, { swr: { enabled: Boolean(productId) } });

  const {
    data: pricing,
    error: pricingError,
    isLoading: pricingLoading,
  } = useGetProductsIdPrice(productId, { settlement }, { swr: { enabled: Boolean(productId && settlement) } });

  const groups = useMemo(
    () => (product && pricing ? buildSystemComponentGroups(product, pricing) : []),
    [product, pricing]
  );

  const isLoading = !router.isReady || productLoading || pricingLoading;
  const hasError = Boolean(productError || pricingError);
  const backHref = buildCatalogRestoreHref(product?.kind, productId, settlement);

  const renderContent = () => {
    if (router.isReady && (!productId || !settlement)) {
      return <Alert severity="error">Липсват параметри за показване на системните компоненти.</Alert>;
    }

    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане на системните компоненти" />
        </Stack>
      );
    }

    if (hasError || !product || !pricing) {
      return <Alert severity="error">Възникна грешка при зареждането на данните.</Alert>;
    }

    return (
      <>
        <SystemComponentsTable groups={groups} />
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} component={Link} href={backHref}>
            Назад
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={openPrintDialog}>
            Печат
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={openPrintDialog}>
            Запази като PDF
          </Button>
        </Stack>
        <SystemComponentsPrint productName={product.name} groups={groups} />
      </>
    );
  };

  return (
    <PageTemplate title="Системни компоненти" heading="Системни компоненти">
      {renderContent()}
    </PageTemplate>
  );
};

export default SystemComponentsPage;
