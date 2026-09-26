import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { usePostFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import {
  INTERNAL_FEE_CATEGORIES_ROUTE,
  INTERNAL_FEE_CATEGORY_CREATE_ROUTE,
  INTERNAL_LOGIN_ROUTE,
} from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_FEE_CATEGORY_CREATE_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const PERCENTAGE_REQUIREMENTS = 'Процентът трябва да е число, поне 0.';

const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'Категория надценка с това име вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува категория надценка с тези данни.';

const schema = z.object({
  name: z.string().min(1, 'Въведете име'),
  percentage: z
    .string()
    .min(1, 'Въведете процент')
    .regex(/^\d+(\.\d+)?$/, PERCENTAGE_REQUIREMENTS)
    .refine(value => Number(value) >= 0, PERCENTAGE_REQUIREMENTS),
});

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

const INITIAL_VALUES: FormValues = { name: '', percentage: '' };

const CreateFeeCategoryPage: NextPage = () => {
  const router = useRouter();
  const { trigger, isMutating } = usePostFeeCategories();
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
      await trigger({ name: result.data.name, percentage: Number(result.data.percentage) });
      await router.push(INTERNAL_FEE_CATEGORIES_ROUTE);
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

      setSubmitError('Неуспешно създаване на категория надценка. Опитайте отново.');
    }
  };

  return (
    <PageTemplate title="Създаване на категория надценка" heading="Създаване на категория надценка" internal>
      <Box sx={{ width: '100%', maxWidth: 640, mt: 4 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={4}>
            <FormSection title="Данни за категорията" columns={2}>
              <ValidatedTextField
                id="name"
                name="name"
                label="Име"
                value={values.name}
                onValueChange={handleChange('name')}
                error={errors.name}
                fullWidth
              />
              <ValidatedTextField
                id="percentage"
                name="percentage"
                label="Процент"
                type="number"
                value={values.percentage}
                onValueChange={handleChange('percentage')}
                error={errors.percentage}
                hint={PERCENTAGE_REQUIREMENTS}
                fullWidth
              />
            </FormSection>
            <Box sx={{ maxWidth: { sm: 320 } }}>
              <Button type="submit" disabled={isMutating} fullWidth>
                Създай категория
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default CreateFeeCategoryPage;
