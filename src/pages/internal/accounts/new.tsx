import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { usePostAccounts } from '@/api/endpoints/accounts/accounts';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_ACCOUNT_CREATE_ROUTE, INTERNAL_ACCOUNTS_ROUTE } from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_ACCOUNT_CREATE_ROUTE);

const PASSWORD_REQUIREMENTS = 'Паролата трябва да е поне 12 символа и да съдържа поне една главна буква и една цифра.';

const DUPLICATE_MESSAGES: Record<string, string> = {
  username: 'Потребител с това име вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува акаунт с тези данни.';

const schema = z
  .object({
    username: z.string().min(1, 'Въведете потребителско име'),
    password: z
      .string()
      .min(1, 'Въведете парола')
      .min(12, PASSWORD_REQUIREMENTS)
      .regex(/[0-9]/, PASSWORD_REQUIREMENTS)
      .regex(/[A-Z]/, PASSWORD_REQUIREMENTS),
    confirmPassword: z.string().min(1, 'Потвърдете паролата'),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Паролите не съвпадат',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

const INITIAL_VALUES: FormValues = { username: '', password: '', confirmPassword: '' };

const CreateAccountPage: NextPage = () => {
  const router = useRouter();
  const { trigger, isMutating } = usePostAccounts();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const handleChange = (field: FieldName) => (value: string) => {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    const result = schema.safeParse(values);

    if (!result.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0];

        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as FieldName] = issue.message;
        }
      }

      setErrors(nextErrors);

      return;
    }

    setErrors({});

    try {
      await trigger({ username: result.data.username, password: result.data.password });
      await router.push(INTERNAL_ACCOUNTS_ROUTE);
    } catch (error) {
      if (isConflictError(error)) {
        const field = getConflictField(error);
        const message = field ? DUPLICATE_MESSAGES[field] : undefined;

        if (field && message) {
          const nextErrors: Partial<Record<FieldName, string>> = {};
          nextErrors[field as FieldName] = message;
          setErrors(nextErrors);

          return;
        }

        setSubmitError(DUPLICATE_FALLBACK_MESSAGE);

        return;
      }

      setSubmitError('Неуспешно създаване на акаунт. Опитайте отново.');
    }
  };

  return (
    <PageTemplate title="Създаване на акаунт" heading="Създаване на акаунт" internal>
      <Box sx={{ width: '100%', maxWidth: 700, mt: 4 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={4}>
            <FormSection title="Потребител">
              <ValidatedTextField
                id="username"
                name="username"
                label="Потребителско име"
                autoComplete="username"
                value={values.username}
                onValueChange={handleChange('username')}
                error={errors.username}
                fullWidth
              />
            </FormSection>

            <FormSection title="Парола" columns={2}>
              <ValidatedTextField
                id="password"
                name="password"
                label="Парола"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onValueChange={handleChange('password')}
                error={errors.password}
                fullWidth
              />
              <ValidatedTextField
                id="confirmPassword"
                name="confirmPassword"
                label="Потвърждение на паролата"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onValueChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                hint={PASSWORD_REQUIREMENTS}
                fullWidth
              />
            </FormSection>

            <Box sx={{ maxWidth: { sm: 320 } }}>
              <Button type="submit" disabled={isMutating} fullWidth>
                Създай акаунт
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default CreateAccountPage;
