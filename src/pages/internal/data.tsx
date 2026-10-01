import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { NextPage } from 'next';

import { getLocationsExport, usePostLocationsImport } from '@/api/endpoints/locations/locations';
import { getProductsExport, usePostProductsImport } from '@/api/endpoints/products/products';
import { PageTemplate } from '@/components';
import { CsvExportButton, CsvImportForm } from '@/components/data';
import type { ICsvImportResult } from '@/components/data';
import { INTERNAL_DATA_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_DATA_ROUTE);

const WARNING_MESSAGE =
  'Качването и експортирането на данни може да отнеме време. Не затваряйте и не опреснявайте страницата — изчакайте операцията да приключи.';

const ensureImportResult = (result: ICsvImportResult | undefined): ICsvImportResult => {
  if (!result) {
    throw new Error('Import returned no result');
  }

  return result;
};

const DataPage: NextPage = () => {
  const { trigger: importLocations } = usePostLocationsImport();
  const { trigger: importProducts } = usePostProductsImport();

  return (
    <PageTemplate title="Импорт и експорт" heading="Импорт и експорт на данни" internal>
      <Stack spacing={4} sx={{ mt: 2 }}>
        <Alert severity="warning">{WARNING_MESSAGE}</Alert>

        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            Импорт от CSV
          </Typography>
          <CsvImportForm
            title="Локации"
            inputId="locations-csv"
            pickerLabel="Изберете CSV файл с локации"
            onImport={async file => ensureImportResult(await importLocations(file))}
          />
          <CsvImportForm
            title="Продукти"
            inputId="products-csv"
            pickerLabel="Изберете CSV файл с продукти"
            onImport={async file => ensureImportResult(await importProducts(await file.text()))}
          />
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            Експорт към CSV
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <CsvExportButton
              label="Експорт на локации"
              filename="locations.csv"
              fetchCsv={() => getLocationsExport()}
            />
            <CsvExportButton label="Експорт на продукти" filename="products.csv" fetchCsv={() => getProductsExport()} />
          </Stack>
        </Stack>
      </Stack>
    </PageTemplate>
  );
};

export default DataPage;
