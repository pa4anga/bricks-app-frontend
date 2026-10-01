import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { usePostSourceLocations } from '@/api/endpoints/source-locations/source-locations';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_SOURCE_LOCATION_CREATE_ROUTE, INTERNAL_SOURCE_LOCATIONS_ROUTE } from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_SOURCE_LOCATION_CREATE_ROUTE);

const CAPACITY_REQUIREMENTS = 'Капацитетът трябва да е цяло число, поне 1.';

const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'Производствена база с това име вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува производствена база с тези данни.';

const schema = z.object({
  name: z.string().min(1, 'Въведете име'),
  truckCapacityKg: z
    .string()
    .min(1, 'Въведете капацитет')
    .regex(/^\d+$/, CAPACITY_REQUIREMENTS)
    .refine(value => Number(value) >= 1, CAPACITY_REQUIREMENTS),
});

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

const INITIAL_VALUES: FormValues = { name: '', truckCapacityKg: '' };

const CreateSourceLocationPage: NextPage = () => {
  const router = useRouter();
  const { trigger, isMutating } = usePostSourceLocations();
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
      await trigger({ name: result.data.name, truckCapacityKg: Number(result.data.truckCapacityKg) });
      await router.push(INTERNAL_SOURCE_LOCATIONS_ROUTE);
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

      setSubmitError('Неуспешно създаване на производствена база. Опитайте отново.');
    }
  };

  return (
    <PageTemplate title="Създаване на производствена база" heading="Създаване на производствена база" internal>
      <Box sx={{ width: '100%', maxWidth: 640, mt: 4 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={4}>
            <FormSection title="Данни за базата" columns={2}>
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
                id="truckCapacityKg"
                name="truckCapacityKg"
                label="Капацитет на камион (кг)"
                type="number"
                value={values.truckCapacityKg}
                onValueChange={handleChange('truckCapacityKg')}
                error={errors.truckCapacityKg}
                hint={CAPACITY_REQUIREMENTS}
                fullWidth
              />
            </FormSection>
            <Box sx={{ maxWidth: { sm: 320 } }}>
              <Button type="submit" disabled={isMutating} fullWidth>
                Създай производствена база
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default CreateSourceLocationPage;
