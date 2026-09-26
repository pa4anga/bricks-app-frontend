import Box from '@mui/material/Box';

import { OfferPrint } from '@/components/content/OfferPrint';
import { ProductInfo } from '@/components/content/ProductInfo';
import { buildSystemComponentsHref } from '@/helpers/priceRoutes';

import { ResultActions } from './ResultActions';
import { useSearchResults } from './searchFormContext';

export const SearchResults = () => {
  const { result } = useSearchResults();

  if (!result) {
    return null;
  }

  const product = result.product.value;
  const hasSystemComponents = Boolean(product.systemComponents && product.systemComponents.length > 0);
  const systemComponentsHref =
    hasSystemComponents && product._id && result.settlementName
      ? buildSystemComponentsHref(product._id, result.settlementName)
      : undefined;

  return (
    <>
      <Box role="region" aria-label="Резултат" sx={{ mt: 3 }}>
        <ProductInfo product={product} pricing={result.pricing} settlementName={result.settlementName} />
      </Box>
      <ResultActions systemComponentsHref={systemComponentsHref} />
      <OfferPrint product={product} pricing={result.pricing} settlementName={result.settlementName} />
    </>
  );
};
