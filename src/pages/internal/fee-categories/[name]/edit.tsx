import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { useGetFeeCategoriesName, usePatchFeeCategoriesName } from '@/api/endpoints/fee-categories/fee-categories';
import type { FeeCategory } from '@/api/model';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_FEE_CATEGORIES_ROUTE, INTERNAL_FEE_CATEGORY_EDIT_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_FEE_CATEGORY_EDIT_ROUTE(typeof context.params?.name === 'string' ? context.params.name : '')
);

const PERCENTAGE_REQUIREMENTS = 'Процентът трябва да е число, поне 0.';

const schema = z.object({
  percentage: z
    .string()
    .min(1, 'Въведете процент')
    .regex(/^\d+(\.\d+)?$/, PERCENTAGE_REQUIREMENTS)
    .refine(value => Number(value) >= 0, PERCENTAGE_REQUIREMENTS),
});

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

interface IEditFeeCategoryFormProps {
  feeCategory: FeeCategory;
}

const EditFeeCategoryForm = ({ feeCategory }: IEditFeeCategoryFormProps) => {
  const router = useRouter();
  const name = feeCategory.name ?? '';
  const { trigger, isMutating } = usePatchFeeCategoriesName(name);
  const [values, setValues] = useState<FormValues>({
    percentage: feeCategory.percentage !== undefined ? String(feeCategory.percentage) : '',
  });
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
      await trigger({ percentage: Number(result.data.percentage) });
      await router.push(INTERNAL_FEE_CATEGORIES_ROUTE);
    } catch {
      setSubmitError('Неуспешно обновяване на категория надценка. Опитайте отново.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 520, mt: 4 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={4}>
          <FormSection title="Данни за категорията">
            <ValidatedTextField id="name" name="name" label="Име" value={name} disabled fullWidth />
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
              Промени категория
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

interface IEditFeeCategoryContentProps {
  name: string;
}

const EditFeeCategoryContent = ({ name }: IEditFeeCategoryContentProps) => {
  const { data: feeCategory, error, isLoading } = useGetFeeCategoriesName(name);

  if (!name || isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане" />
      </Stack>
    );
  }

  if (error || !feeCategory) {
    return <Alert severity="error">Неуспешно зареждане на категорията надценка.</Alert>;
  }

  return <EditFeeCategoryForm feeCategory={feeCategory} />;
};

const EditFeeCategoryPage: NextPage = () => {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : '';

  return (
    <PageTemplate title="Промяна на категория надценка" heading="Промяна на категория надценка" internal>
      <EditFeeCategoryContent name={name} />
    </PageTemplate>
  );
};

export default EditFeeCategoryPage;
