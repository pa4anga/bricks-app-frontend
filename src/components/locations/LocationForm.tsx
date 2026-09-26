import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { useGetSourceLocations } from '@/api/endpoints/source-locations/source-locations';
import type { LocationInput } from '@/api/model';
import { PointType } from '@/api/model';
import { Button, FieldArray, FormSection, ValidatedTextField } from '@/components/form';
import type { IFieldArrayHandle } from '@/components/form';
import { INTERNAL_LOCATIONS_ROUTE } from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';

import { PriceEntry } from './PriceEntry';
import { SourceExclusionContext } from './sourceExclusionContext';
import type { ILocationFormValues, IPriceEntryValue } from './types';

const LATITUDE_REQUIREMENTS = 'Географската ширина трябва да е число между -90 и 90.';
const LONGITUDE_REQUIREMENTS = 'Географската дължина трябва да е число между -180 и 180.';
const POSTCODE_REQUIREMENTS = 'Пощенският код трябва да е цяло число.';
const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'Локация с това име вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува локация с тези данни.';

const coordinate = (requirements: string, limit: number) =>
  z
    .string()
    .min(1, requirements)
    .regex(/^-?\d+(\.\d+)?$/, requirements)
    .refine(value => Math.abs(Number(value)) <= limit, requirements);

const schema = z.object({
  name: z.string().min(1, 'Въведете име').max(100, 'Името може да е най-много 100 символа.'),
  latitude: coordinate(LATITUDE_REQUIREMENTS, 90),
  longitude: coordinate(LONGITUDE_REQUIREMENTS, 180),
  postcode: z.string().refine(value => value === '' || /^\d+$/.test(value), POSTCODE_REQUIREMENTS),
  municipality: z.string(),
  sapRegion: z.string(),
  salesWbRegion: z.string(),
});

type ScalarValues = z.infer<typeof schema>;
type FieldName = keyof ScalarValues;

const priceEntrySchema: z.ZodType<IPriceEntryValue> = z.object({
  source: z.string().min(1, 'Изберете източник.'),
  price: z
    .string()
    .min(1, 'Въведете цена.')
    .regex(/^\d+(\.\d+)?$/, 'Цената трябва да е неотрицателно число.'),
});

const EMPTY_VALUES: ILocationFormValues = {
  name: '',
  latitude: '',
  longitude: '',
  postcode: '',
  municipality: '',
  sapRegion: '',
  salesWbRegion: '',
  prices: [],
};

const toScalarValues = (values: ILocationFormValues): ScalarValues => ({
  name: values.name,
  latitude: values.latitude,
  longitude: values.longitude,
  postcode: values.postcode,
  municipality: values.municipality,
  sapRegion: values.sapRegion,
  salesWbRegion: values.salesWbRegion,
});

export interface ILocationFormProps {
  submitLabel: string;
  submitErrorMessage: string;
  submitting: boolean;
  submit: (input: LocationInput) => Promise<unknown>;
  initialValues?: ILocationFormValues;
  nameDisabled?: boolean;
}

export const LocationForm = ({
  submitLabel,
  submitErrorMessage,
  submitting,
  submit,
  initialValues,
  nameDisabled = false,
}: ILocationFormProps) => {
  const router = useRouter();
  const initial = initialValues ?? EMPTY_VALUES;
  const [values, setValues] = useState<ScalarValues>(() => toScalarValues(initial));
  const [prices, setPrices] = useState<IPriceEntryValue[]>(() => initial.prices);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const fieldArrayRef = useRef<IFieldArrayHandle>(null);

  const { data: sourceLocations } = useGetSourceLocations();

  const options = useMemo(
    () => (sourceLocations ?? []).map(item => item.name).filter((name): name is string => Boolean(name)),
    [sourceLocations]
  );

  const exclusionValue = useMemo(
    () => ({ options, selectedSources: prices.map(entry => entry.source).filter(Boolean) }),
    [options, prices]
  );

  const handleChange = (field: FieldName) => (value: string) => {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    const result = schema.safeParse(values);
    const pricesValid = fieldArrayRef.current?.validate() ?? true;

    if (result.success) {
      setErrors({});
    } else {
      const nextErrors: Partial<Record<FieldName, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0];

        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as FieldName] = issue.message;
        }
      }

      setErrors(nextErrors);
    }

    if (!result.success || !pricesValid) {
      return;
    }

    const input: LocationInput = {
      name: result.data.name,
      coordinates: {
        type: PointType.Point,
        coordinates: [Number(result.data.longitude), Number(result.data.latitude)],
      },
      postcode: result.data.postcode ? Number(result.data.postcode) : undefined,
      municipality: result.data.municipality || undefined,
      sapRegion: result.data.sapRegion || undefined,
      salesWbRegion: result.data.salesWbRegion || undefined,
      prices: prices.length ? prices.map(entry => ({ source: entry.source, price: Number(entry.price) })) : undefined,
    };

    try {
      await submit(input);
      await router.push(INTERNAL_LOCATIONS_ROUTE);
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
              disabled={nameDisabled}
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

          <FormSection title="Адресни данни" columns={2}>
            <ValidatedTextField
              id="postcode"
              name="postcode"
              label="Пощенски код"
              type="number"
              value={values.postcode}
              onValueChange={handleChange('postcode')}
              error={errors.postcode}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              fullWidth
            />
            <ValidatedTextField
              id="municipality"
              name="municipality"
              label="Община"
              value={values.municipality}
              onValueChange={handleChange('municipality')}
              error={errors.municipality}
              fullWidth
            />
            <ValidatedTextField
              id="sapRegion"
              name="sapRegion"
              label="SAP регион"
              value={values.sapRegion}
              onValueChange={handleChange('sapRegion')}
              error={errors.sapRegion}
              fullWidth
            />
            <ValidatedTextField
              id="salesWbRegion"
              name="salesWbRegion"
              label="Търговски регион"
              value={values.salesWbRegion}
              onValueChange={handleChange('salesWbRegion')}
              error={errors.salesWbRegion}
              fullWidth
            />
          </FormSection>

          <FormSection title="Цени">
            <SourceExclusionContext.Provider value={exclusionValue}>
              <FieldArray<IPriceEntryValue>
                value={prices}
                onChange={setPrices}
                component={PriceEntry}
                createEntry={() => ({ source: '', price: '' })}
                entrySchema={priceEntrySchema}
                maxEntries={options.length}
                addAriaLabel="Добави цена"
                removeAriaLabel="Премахни цена"
                ref={fieldArrayRef}
              />
            </SourceExclusionContext.Provider>
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
