import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { API_BASE_URL } from '@/api/axiosInstance';
import { useGetFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { useGetSourceLocations } from '@/api/endpoints/source-locations/source-locations';
import type { Product, ProductInput } from '@/api/model';
import { ProductInputBaseProductionSource, ProductPriceUnit } from '@/api/model';
import { ImageUpload } from '@/components/common';
import type { IImageUploadHandle } from '@/components/common';
import { Button, FieldArray, FormRow, FormSection, ValidatedTextField } from '@/components/form';
import type { IProductKind } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_LIST_ROUTE } from '@/constants/routes';
import { getConflictField, isConflictError } from '@/helpers/apiErrors';

import {
  isPositiveNumberString,
  MAX_500_MESSAGE,
  numberToString,
  optionalPositiveNumber,
  optionalText,
  positiveInteger,
  positiveNumber,
  PRICE_PER_SQUARE_METER_MESSAGE,
  PRICE_UNIT_MESSAGE,
  PRICE_UNIT_OPTIONS,
  RAW_UNIT_PRICE_MESSAGE,
  requiredSelection,
  requiredText,
} from './productValidation';
import {
  computeSystemComponentErrors,
  createEmptySystemComponent,
  SystemComponentErrorsProvider,
  SystemComponentFields,
  systemComponentToInput,
  systemComponentToValue,
} from './SystemComponentFields';
import type { ISystemComponentValue } from './SystemComponentFields';

const DUPLICATE_MESSAGES: Record<string, string> = {
  name: 'Продукт с това име вече съществува.',
  sapNumber: 'Продукт с този SAP номер вече съществува.',
};
const DUPLICATE_FALLBACK_MESSAGE = 'Вече съществува продукт с тези данни.';
const PRODUCTION_SOURCE_MESSAGE = 'Изберете произход.';

const PRODUCTION_SOURCE_VALUES = Object.values(ProductInputBaseProductionSource);

const schema = z.object({
  name: requiredText('Въведете име'),
  subtype: requiredText('Въведете тип'),
  priceUnit: requiredSelection(PRICE_UNIT_MESSAGE),
  rawUnitPrice: z.string(),
  pricePerSquareMeter: z.string(),
  countPerPallet: positiveInteger('Въведете брой в палет (цяло число, поне 1).'),
  minimumOrderUnits: positiveInteger('Въведете минимално количество (цяло число, поне 1).'),
  unitsPerSquareMeter: optionalPositiveNumber('Броят на м² трябва да е число, по-голямо от 0.'),
  palletWeightKg: positiveNumber('Въведете тегло на палет (число, по-голямо от 0).'),
  rasterSize: optionalText(),
  iconLoad: optionalText(),
  classification: optionalText(),
  productionSource: requiredSelection(PRODUCTION_SOURCE_MESSAGE),
  sourceLocation: requiredSelection('Изберете производствена база.'),
  feeCategory: requiredSelection('Изберете категория надценка.'),
  sapNumber: requiredText('Въведете SAP номер.'),
  comment: optionalText(500, MAX_500_MESSAGE),
});

type ScalarValues = z.infer<typeof schema>;

export interface IProductFormValues extends ScalarValues {
  variant: string;
  system: string;
  systemComponents: ISystemComponentValue[];
}

type FieldName = keyof IProductFormValues;

const EMPTY_VALUES: IProductFormValues = {
  name: '',
  subtype: '',
  priceUnit: ProductPriceUnit.бр,
  rawUnitPrice: '',
  pricePerSquareMeter: '',
  countPerPallet: '',
  minimumOrderUnits: '',
  unitsPerSquareMeter: '',
  palletWeightKg: '',
  rasterSize: '',
  iconLoad: '',
  classification: '',
  productionSource: '',
  sourceLocation: '',
  feeCategory: '',
  sapNumber: '',
  comment: '',
  variant: '',
  system: '',
  systemComponents: [],
};

export const productToFormValues = (product: Product): IProductFormValues => ({
  name: product.name ?? '',
  subtype: product.subtype ?? '',
  priceUnit: product.priceUnit ?? ProductPriceUnit.бр,
  rawUnitPrice: numberToString(product.rawUnitPrice),
  pricePerSquareMeter: numberToString(product.pricePerSquareMeter),
  countPerPallet: numberToString(product.countPerPallet),
  minimumOrderUnits: numberToString(product.minimumOrderUnits),
  unitsPerSquareMeter: numberToString(product.unitsPerSquareMeter),
  palletWeightKg: numberToString(product.palletWeightKg),
  rasterSize: product.rasterSize ?? '',
  iconLoad: product.iconLoad ?? '',
  classification: product.classification ?? '',
  productionSource: product.productionSource ?? '',
  sourceLocation: product.sourceLocation ?? '',
  feeCategory: product.feeCategory ?? '',
  sapNumber: product.sapNumber ?? '',
  comment: product.comment ?? '',
  variant: product.variant ?? '',
  system: product.system ?? '',
  systemComponents: (product.systemComponents ?? []).map(systemComponentToValue),
});

export interface IProductFormProps {
  productKind: IProductKind;
  submitLabel: string;
  submitErrorMessage: string;
  submitting: boolean;
  submit: (input: ProductInput) => Promise<unknown>;
  initialValues?: IProductFormValues;
  existingImageId?: string;
}

export const ProductForm = ({
  productKind,
  submitLabel,
  submitErrorMessage,
  submitting,
  submit,
  initialValues,
  existingImageId,
}: IProductFormProps) => {
  const router = useRouter();
  const [values, setValues] = useState<IProductFormValues>(initialValues ?? EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [showComponentErrors, setShowComponentErrors] = useState(false);
  const imageRef = useRef<IImageUploadHandle>(null);
  const initialPreviewUrl = existingImageId ? `${API_BASE_URL}/images/${existingImageId}` : undefined;

  const { data: sourceLocations } = useGetSourceLocations();
  const { data: feeCategories } = useGetFeeCategories();

  const sourceOptions = useMemo(() => {
    const names = (sourceLocations ?? []).map(item => item.name).filter((name): name is string => Boolean(name));

    return values.sourceLocation && !names.includes(values.sourceLocation) ? [...names, values.sourceLocation] : names;
  }, [sourceLocations, values.sourceLocation]);

  const feeOptions = useMemo(() => {
    const names = (feeCategories ?? []).map(item => item.name).filter((name): name is string => Boolean(name));

    return values.feeCategory && !names.includes(values.feeCategory) ? [...names, values.feeCategory] : names;
  }, [feeCategories, values.feeCategory]);

  const componentErrors = useMemo(
    () => computeSystemComponentErrors(values.systemComponents, values.name),
    [values.systemComponents, values.name]
  );

  const handleSystemComponentsChange = (next: ISystemComponentValue[]) => {
    setValues(previous => ({ ...previous, systemComponents: next }));
  };

  const handleChange = (field: FieldName) => (value: string) => {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    const result = schema.safeParse(values);
    const imageValid = imageRef.current?.validate() ?? false;
    const nextErrors: Partial<Record<FieldName, string>> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];

        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as FieldName] = issue.message;
        }
      }
    }

    if (productKind.showVariant && values.variant.trim() === '') {
      nextErrors.variant = 'Въведете вариант';
    }

    if (productKind.showSystem && values.system.trim() === '') {
      nextErrors.system = 'Въведете система';
    }

    const isSquareMeter = values.priceUnit === ProductPriceUnit.m2;
    const priceField: FieldName = isSquareMeter ? 'pricePerSquareMeter' : 'rawUnitPrice';
    const priceValue = isSquareMeter ? values.pricePerSquareMeter : values.rawUnitPrice;

    if (!nextErrors[priceField] && !isPositiveNumberString(priceValue)) {
      nextErrors[priceField] = isSquareMeter ? PRICE_PER_SQUARE_METER_MESSAGE : RAW_UNIT_PRICE_MESSAGE;
    }

    if (productKind.showSystem) {
      setShowComponentErrors(true);
    }

    const componentsInvalid = productKind.showSystem && componentErrors.some(entry => Object.keys(entry).length > 0);

    setErrors(nextErrors);

    if (!result.success || !imageValid || Object.keys(nextErrors).length > 0 || componentsInvalid) {
      return;
    }

    const productionSource = PRODUCTION_SOURCE_VALUES.find(source => source === result.data.productionSource);

    if (!productionSource) {
      setErrors(previous => ({ ...previous, productionSource: PRODUCTION_SOURCE_MESSAGE }));

      return;
    }

    const imageHandle = imageRef.current;
    let imageId = existingImageId;

    if (imageHandle?.getFile()) {
      const uploaded = await imageHandle.upload();

      if (!uploaded) {
        return;
      }

      imageId = uploaded;
    }

    if (!imageId) {
      return;
    }

    const data = result.data;
    const base = {
      name: data.name,
      kind: productKind.kind,
      variant: productKind.showVariant ? values.variant.trim() : data.name,
      system: productKind.showSystem ? values.system.trim() : data.name,
      subtype: data.subtype,
      comment: data.comment || undefined,
      countPerPallet: Number(data.countPerPallet),
      minimumOrderUnits: Number(data.minimumOrderUnits),
      palletWeightKg: Number(data.palletWeightKg),
      unitsPerSquareMeter:
        productKind.showUnitsPerSquareMeter && data.unitsPerSquareMeter ? Number(data.unitsPerSquareMeter) : undefined,
      classification: data.classification || undefined,
      sourceLocation: data.sourceLocation,
      sapNumber: data.sapNumber,
      feeCategory: data.feeCategory,
      rasterSize: data.rasterSize || undefined,
      iconLoad: productKind.showIconLoad && data.iconLoad ? data.iconLoad : undefined,
      systemComponents: productKind.showSystem ? values.systemComponents.map(systemComponentToInput) : undefined,
      productionSource,
      imageId,
    };

    const input: ProductInput =
      values.priceUnit === ProductPriceUnit.m2
        ? { ...base, priceUnit: ProductPriceUnit.m2, pricePerSquareMeter: Number(data.pricePerSquareMeter) }
        : { ...base, priceUnit: ProductPriceUnit.бр, rawUnitPrice: Number(data.rawUnitPrice) };

    try {
      await submit(input);
      await router.push(INTERNAL_PRODUCT_LIST_ROUTE(productKind.slug));
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
    <Box sx={{ width: '100%', maxWidth: 880, mt: 4 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={4}>
          <FormSection title="Основни данни" columns={2}>
            <ValidatedTextField
              id="name"
              name="name"
              label="Име"
              value={values.name}
              onValueChange={handleChange('name')}
              error={errors.name}
              fullWidth
            />
            {productKind.showVariant && (
              <ValidatedTextField
                id="variant"
                name="variant"
                label={productKind.variantLabel ?? 'Вариант'}
                value={values.variant}
                onValueChange={handleChange('variant')}
                error={errors.variant}
                fullWidth
              />
            )}
            {productKind.showSystem && (
              <ValidatedTextField
                id="system"
                name="system"
                label="Система"
                value={values.system}
                onValueChange={handleChange('system')}
                error={errors.system}
                fullWidth
              />
            )}
            <ValidatedTextField
              id="subtype"
              name="subtype"
              label="Тип"
              value={values.subtype}
              onValueChange={handleChange('subtype')}
              error={errors.subtype}
              fullWidth
            />
          </FormSection>

          <FormSection title="Ценообразуване" columns={2}>
            <TextField
              select
              id="priceUnit"
              name="priceUnit"
              label="Мерна единица за цена"
              value={values.priceUnit}
              onChange={event => handleChange('priceUnit')(event.target.value)}
              error={Boolean(errors.priceUnit)}
              helperText={errors.priceUnit}
              fullWidth
            >
              {PRICE_UNIT_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {values.priceUnit === ProductPriceUnit.m2 ? (
              <ValidatedTextField
                id="pricePerSquareMeter"
                name="pricePerSquareMeter"
                label="Цена на м²"
                type="number"
                value={values.pricePerSquareMeter}
                onValueChange={handleChange('pricePerSquareMeter')}
                error={errors.pricePerSquareMeter}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                fullWidth
              />
            ) : (
              <ValidatedTextField
                id="rawUnitPrice"
                name="rawUnitPrice"
                label="Единична цена"
                type="number"
                value={values.rawUnitPrice}
                onValueChange={handleChange('rawUnitPrice')}
                error={errors.rawUnitPrice}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                fullWidth
              />
            )}
            <TextField
              select
              id="feeCategory"
              name="feeCategory"
              label="Категория надценка"
              value={values.feeCategory}
              onChange={event => handleChange('feeCategory')(event.target.value)}
              error={Boolean(errors.feeCategory)}
              helperText={errors.feeCategory}
              fullWidth
            >
              {feeOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </FormSection>

          <FormSection title="Опаковка и количества" columns={2}>
            <ValidatedTextField
              id="countPerPallet"
              name="countPerPallet"
              label="Брой в палет"
              type="number"
              value={values.countPerPallet}
              onValueChange={handleChange('countPerPallet')}
              error={errors.countPerPallet}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              fullWidth
            />
            <ValidatedTextField
              id="minimumOrderUnits"
              name="minimumOrderUnits"
              label="Минимално количество"
              type="number"
              value={values.minimumOrderUnits}
              onValueChange={handleChange('minimumOrderUnits')}
              error={errors.minimumOrderUnits}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              fullWidth
            />
            {productKind.showUnitsPerSquareMeter && (
              <ValidatedTextField
                id="unitsPerSquareMeter"
                name="unitsPerSquareMeter"
                label="Брой на м²"
                type="number"
                value={values.unitsPerSquareMeter}
                onValueChange={handleChange('unitsPerSquareMeter')}
                error={errors.unitsPerSquareMeter}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                fullWidth
              />
            )}
            <ValidatedTextField
              id="palletWeightKg"
              name="palletWeightKg"
              label="Тегло на палет (кг)"
              type="number"
              value={values.palletWeightKg}
              onValueChange={handleChange('palletWeightKg')}
              error={errors.palletWeightKg}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              fullWidth
            />
          </FormSection>

          <FormSection title="Произход" columns={2}>
            <TextField
              select
              id="productionSource"
              name="productionSource"
              label="Произход"
              value={values.productionSource}
              onChange={event => handleChange('productionSource')(event.target.value)}
              error={Boolean(errors.productionSource)}
              helperText={errors.productionSource}
              fullWidth
            >
              {PRODUCTION_SOURCE_VALUES.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              id="sourceLocation"
              name="sourceLocation"
              label="Производствена база"
              value={values.sourceLocation}
              onChange={event => handleChange('sourceLocation')(event.target.value)}
              error={Boolean(errors.sourceLocation)}
              helperText={errors.sourceLocation}
              fullWidth
            >
              {sourceOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <ValidatedTextField
              id="sapNumber"
              name="sapNumber"
              label="SAP номер"
              value={values.sapNumber}
              onValueChange={handleChange('sapNumber')}
              error={errors.sapNumber}
              fullWidth
            />
          </FormSection>

          <FormSection title="Допълнителни данни" columns={2}>
            <ValidatedTextField
              id="rasterSize"
              name="rasterSize"
              label="Размер"
              value={values.rasterSize}
              onValueChange={handleChange('rasterSize')}
              error={errors.rasterSize}
              fullWidth
            />
            {productKind.showIconLoad && (
              <ValidatedTextField
                id="iconLoad"
                name="iconLoad"
                label="Икона (Натоварване)"
                value={values.iconLoad}
                onValueChange={handleChange('iconLoad')}
                error={errors.iconLoad}
                fullWidth
              />
            )}
            <ValidatedTextField
              id="classification"
              name="classification"
              label="Клас на доставка"
              value={values.classification}
              onValueChange={handleChange('classification')}
              error={errors.classification}
              fullWidth
            />
            <FormRow>
              <ValidatedTextField
                id="comment"
                name="comment"
                label="Коментар"
                value={values.comment}
                onValueChange={handleChange('comment')}
                error={errors.comment}
                multiline
                minRows={3}
                fullWidth
              />
            </FormRow>
          </FormSection>

          {productKind.showSystem && (
            <FormSection title="Системни компоненти">
              <SystemComponentErrorsProvider value={{ show: showComponentErrors, errors: componentErrors }}>
                <FieldArray
                  value={values.systemComponents}
                  onChange={handleSystemComponentsChange}
                  component={SystemComponentFields}
                  createEntry={createEmptySystemComponent}
                  addAriaLabel="Добави компонент"
                  removeAriaLabel="Премахни компонент"
                />
              </SystemComponentErrorsProvider>
            </FormSection>
          )}

          <FormSection title="Изображение">
            <ImageUpload ref={imageRef} required={!existingImageId} initialPreviewUrl={initialPreviewUrl} />
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
