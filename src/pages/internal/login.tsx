import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { z } from 'zod';

import { getGetAccountsMeKey } from '@/api/endpoints/accounts/accounts';
import { usePostLogin } from '@/api/endpoints/auth/auth';
import { PageTemplate } from '@/components';
import { Button, Form, TextBox } from '@/components/form';
import { INTERNAL_DASHBOARD_ROUTE } from '@/constants/routes';
import { getSafeRedirect } from '@/helpers/getSafeRedirect';
import { useIsAuthenticated } from '@/hooks';

const schema = z.object({
  username: z.string().min(1, 'Въведете потребителско име'),
  password: z.string().min(1, 'Въведете парола'),
});

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = usePostLogin();
  const { isAuthenticated, isCheckingSession } = useIsAuthenticated();
  const [hasError, setHasError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      void router.replace(INTERNAL_DASHBOARD_ROUTE);
    }
  }, [isAuthenticated, isRedirecting, router]);

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setHasError(false);

    try {
      await trigger(values);
      setIsRedirecting(true);
      await mutate(getGetAccountsMeKey()).catch(() => undefined);
      const redirect = getSafeRedirect(router.query.redirect);
      await router.replace(redirect ?? INTERNAL_DASHBOARD_ROUTE);
    } catch {
      setIsRedirecting(false);
      setHasError(true);
    }
  };

  if (isCheckingSession || isAuthenticated || isRedirecting) {
    return (
      <PageTemplate title="Вход" heading="Вход" bare>
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Вход" heading="Вход" bare>
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Грешно потребителско име или парола.
          </Alert>
        )}
        <Form schema={schema} onSubmit={handleSubmit} initialValues={{ username: '', password: '' }}>
          <TextBox id="username" name="username" label="Потребителско име" autoComplete="username" fullWidth />
          <TextBox
            id="password"
            name="password"
            label="Парола"
            type="password"
            autoComplete="current-password"
            fullWidth
          />
          <Button type="submit" disabled={isMutating} fullWidth>
            Вход
          </Button>
        </Form>
      </Box>
    </PageTemplate>
  );
};

export default LoginPage;
