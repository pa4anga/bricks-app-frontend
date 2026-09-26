import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { z } from 'zod';

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
  const { trigger, isMutating } = usePostLogin();
  const { isAuthenticated, isCheckingSession } = useIsAuthenticated();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void router.replace(INTERNAL_DASHBOARD_ROUTE);
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setHasError(false);

    try {
      await trigger(values);
      const redirect = getSafeRedirect(router.query.redirect);
      await router.replace(redirect ?? INTERNAL_DASHBOARD_ROUTE);
    } catch {
      setHasError(true);
    }
  };

  if (isCheckingSession || isAuthenticated) {
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
