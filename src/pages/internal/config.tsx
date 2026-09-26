import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { useGetConfig, usePatchConfig } from '@/api/endpoints/config/config';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_CONFIG_ROUTE, INTERNAL_LOGIN_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_CONFIG_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const VAT_INPUT_PATTERN = /^\d*\.?\d*$/;
const VAT_VALUE_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)$/;
const VAT_INVALID_MESSAGE = 'Въведете валидно число.';
const LOAD_FAILED_MESSAGE = 'Неуспешно зареждане на настройките.';
const SAVE_FAILED_MESSAGE = 'Неуспешно запазване на настройките.';
const SAVE_SUCCESS_MESSAGE = 'Настройките са запазени.';

const ConfigPage: NextPage = () => {
  const { data: config, error, isLoading, mutate } = useGetConfig();
  const { trigger, isMutating } = usePatchConfig();
  const [vat, setVat] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [vatError, setVatError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!initialized && config) {
      setVat(config.vat !== undefined ? String(config.vat) : '');
      setInitialized(true);
    }
  }, [config, initialized]);

  const handleVatChange = (next: string) => {
    if (VAT_INPUT_PATTERN.test(next)) {
      setVat(next);
      setVatError(undefined);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    const trimmed = vat.trim();

    if (!VAT_VALUE_PATTERN.test(trimmed)) {
      setVatError(VAT_INVALID_MESSAGE);

      return;
    }

    setVatError(undefined);

    try {
      await trigger({ vat: Number(trimmed) });
      await mutate();
      setSaved(true);
    } catch {
      setSubmitError(SAVE_FAILED_MESSAGE);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !config) {
      return <Alert severity="error">{LOAD_FAILED_MESSAGE}</Alert>;
    }

    return (
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 400 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Stack spacing={4}>
          <FormSection title="Общи настройки" columns={1}>
            <ValidatedTextField
              id="vat"
              name="vat"
              label="ДДС (%)"
              value={vat}
              onValueChange={handleVatChange}
              error={vatError}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              fullWidth
            />
          </FormSection>
          <Box>
            <Button type="submit" disabled={isMutating}>
              Приложи
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <PageTemplate title="Настройки" heading="Настройки" internal>
      <Stack spacing={3} sx={{ mt: 2 }}>
        {renderContent()}
      </Stack>
      <Snackbar open={saved} autoHideDuration={5000} onClose={() => setSaved(false)}>
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ width: '100%' }}>
          {SAVE_SUCCESS_MESSAGE}
        </Alert>
      </Snackbar>
    </PageTemplate>
  );
};

export default ConfigPage;
