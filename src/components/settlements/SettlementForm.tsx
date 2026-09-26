import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import type { SettlementInput } from '@/api/model';
import { PointType } from '@/api/model';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_SETTLEMENTS_ROUTE } from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';

const LATITUDE_REQUIREMENTS = 'Географската ширина трябва да е число между -90 и 90.';
const LONGITUDE_REQUIREMENTS = 'Географската дължина трябва да е число между -180 и 180.';
const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'Населено място с това име вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува населено място с тези данни.';

const coordinate = (requirements: string, limit: number) =>
  z
    .string()
    .min(1, requirements)
    .regex(/^-?\d+(\.\d+)?$/, requirements)
    .refine(value => Math.abs(Number(value)) <= limit, requirements);

const schema = z.object({
  name: z.string().min(1, 'Въведете име'),
  latitude: coordinate(LATITUDE_REQUIREMENTS, 90),
  longitude: coordinate(LONGITUDE_REQUIREMENTS, 180),
});

export type SettlementFormValues = z.infer<typeof schema>;
type FieldName = keyof SettlementFormValues;

const EMPTY_VALUES: SettlementFormValues = { name: '', latitude: '', longitude: '' };

export interface ISettlementFormProps {
  submitLabel: string;
  submitErrorMessage: string;
  submitting: boolean;
  submit: (input: SettlementInput) => Promise<unknown>;
  initialValues?: SettlementFormValues;
}

export const SettlementForm = ({
  submitLabel,
  submitErrorMessage,
  submitting,
  submit,
  initialValues,
}: ISettlementFormProps) => {
  const router = useRouter();
  const [values, setValues] = useState<SettlementFormValues>(initialValues ?? EMPTY_VALUES);
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
      await submit({
        name: result.data.name,
        coordinates: {
          type: PointType.Point,
          coordinates: [Number(result.data.longitude), Number(result.data.latitude)],
        },
      });
      await router.push(INTERNAL_SETTLEMENTS_ROUTE);
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

      setSubmitError(submitErrorMessage);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 760, mt: 4 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={4}>
          <FormSection title="Основни данни">
            <ValidatedTextField
              id="name"
              name="name"
              label="Име"
              value={values.name}
              onValueChange={handleChange('name')}
              error={errors.name}
              fullWidth
            />
          </FormSection>

          <FormSection title="Координати" columns={2}>
            <ValidatedTextField
              id="latitude"
              name="latitude"
              label="Географска ширина"
              type="number"
              value={values.latitude}
              onValueChange={handleChange('latitude')}
              error={errors.latitude}
              hint={LATITUDE_REQUIREMENTS}
              slotProps={{ htmlInput: { step: 'any', min: -90, max: 90 } }}
              fullWidth
            />
            <ValidatedTextField
              id="longitude"
              name="longitude"
              label="Географска дължина"
              type="number"
              value={values.longitude}
              onValueChange={handleChange('longitude')}
              error={errors.longitude}
              hint={LONGITUDE_REQUIREMENTS}
              slotProps={{ htmlInput: { step: 'any', min: -180, max: 180 } }}
              fullWidth
            />
          </FormSection>

          <Box sx={{ maxWidth: { sm: 320 } }}>
            <Button type="submit" disabled={submitting} fullWidth>
              {submitLabel}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};
