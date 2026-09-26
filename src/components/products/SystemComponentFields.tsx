import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createContext, useContext, useMemo } from 'react';
import { z } from 'zod';

import { useGetFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { useGetSourceLocations } from '@/api/endpoints/source-locations/source-locations';
import type { SystemComponent, SystemComponentInput } from '@/api/model';
import { ProductPriceUnit } from '@/api/model';
import { FormRow, FormSection, ValidatedTextField } from '@/components/form';
import type { IFieldArrayEntryProps } from '@/components/form';

import {
  isPositiveNumberString,
  numberToString,
  positiveInteger,
  positiveNumber,
  PRICE_PER_SQUARE_METER_MESSAGE,
  PRICE_UNIT_MESSAGE,
  PRICE_UNIT_OPTIONS,
  RAW_UNIT_PRICE_MESSAGE,
  requiredSelection,
  requiredText,
} from './productValidation';

export const DUPLICATE_COMPONENT_NAME_MESSAGE =
  'Името трябва да е уникално и различно от продукта и другите компоненти.';

export interface ISystemComponentValue {
  name: string;
  kind: string;
  priceUnit: string;
  rawUnitPrice: string;
  pricePerSquareMeter: string;
  unitsPerSquareMeter: string;
  palletWeightKg: string;
  countPerPallet: string;
  minimumOrderUnits: string;
  sourceLocation: string;
  sapNumber: string;
  feeCategory: string;
}

export type ISystemComponentErrors = Partial<Record<keyof ISystemComponentValue, string>>;

export const systemComponentSchema = z.object({
  name: requiredText('Въведете име на компонент'),
  kind: requiredText('Въведете вид на компонент'),
  priceUnit: requiredSelection(PRICE_UNIT_MESSAGE),
  unitsPerSquareMeter: positiveNumber('Въведете брой на м² (число, по-голямо от 0).'),
  palletWeightKg: positiveNumber('Въведете тегло на палет (число, по-голямо от 0).'),
  countPerPallet: positiveInteger('Въведете брой в палет (цяло число, поне 1).'),
  minimumOrderUnits: positiveInteger('Въведете минимално количество (цяло число, поне 1).'),
  sourceLocation: requiredSelection('Изберете производствена база.'),
  sapNumber: requiredText('Въведете SAP номер.'),
  feeCategory: requiredSelection('Изберете категория надценка.'),
});

export const createEmptySystemComponent = (): ISystemComponentValue => ({
  name: '',
  kind: '',
  priceUnit: ProductPriceUnit.бр,
  rawUnitPrice: '',
  pricePerSquareMeter: '',
  unitsPerSquareMeter: '',
  palletWeightKg: '',
  countPerPallet: '',
  minimumOrderUnits: '',
  sourceLocation: '',
  sapNumber: '',
  feeCategory: '',
});

export const systemComponentToValue = (component: SystemComponent): ISystemComponentValue => ({
  name: component.name ?? '',
  kind: component.kind ?? '',
  priceUnit: component.priceUnit ?? ProductPriceUnit.бр,
  rawUnitPrice: numberToString(component.rawUnitPrice),
  pricePerSquareMeter: numberToString(component.pricePerSquareMeter),
  unitsPerSquareMeter: numberToString(component.unitsPerSquareMeter),
  palletWeightKg: numberToString(component.palletWeightKg),
  countPerPallet: numberToString(component.countPerPallet),
  minimumOrderUnits: numberToString(component.minimumOrderUnits),
  sourceLocation: component.sourceLocation ?? '',
  sapNumber: component.sapNumber ?? '',
  feeCategory: component.feeCategory ?? '',
});

export const systemComponentToInput = (value: ISystemComponentValue): SystemComponentInput => {
  const base = {
    name: value.name.trim(),
    kind: value.kind.trim(),
    unitsPerSquareMeter: Number(value.unitsPerSquareMeter),
    palletWeightKg: Number(value.palletWeightKg),
    countPerPallet: Number(value.countPerPallet),
    minimumOrderUnits: Number(value.minimumOrderUnits),
    sourceLocation: value.sourceLocation,
    sapNumber: value.sapNumber.trim(),
    feeCategory: value.feeCategory,
  };

  return value.priceUnit === ProductPriceUnit.m2
    ? { ...base, priceUnit: ProductPriceUnit.m2, pricePerSquareMeter: Number(value.pricePerSquareMeter) }
    : { ...base, priceUnit: ProductPriceUnit.бр, rawUnitPrice: Number(value.rawUnitPrice) };
};

export const computeSystemComponentErrors = (
  components: ISystemComponentValue[],
  productName: string
): ISystemComponentErrors[] => {
  const errors = components.map(component => {
    const result = systemComponentSchema.safeParse(component);
    const fieldErrors: ISystemComponentErrors = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];

        if (typeof key === 'string' && !(key in fieldErrors)) {
          fieldErrors[key as keyof ISystemComponentValue] = issue.message;
        }
      }
    }

    const isSquareMeter = component.priceUnit === ProductPriceUnit.m2;
    const priceField: keyof ISystemComponentValue = isSquareMeter ? 'pricePerSquareMeter' : 'rawUnitPrice';
    const priceValue = isSquareMeter ? component.pricePerSquareMeter : component.rawUnitPrice;

    if (!fieldErrors[priceField] && !isPositiveNumberString(priceValue)) {
      fieldErrors[priceField] = isSquareMeter ? PRICE_PER_SQUARE_METER_MESSAGE : RAW_UNIT_PRICE_MESSAGE;
    }

    return fieldErrors;
  });

  const normalize = (name: string) => name.trim().toLowerCase();
  const counts = new Map<string, number>();
  const increment = (name: string) => {
    if (name) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  };

  increment(normalize(productName));
  components.forEach(component => increment(normalize(component.name)));

  components.forEach((component, index) => {
    const name = normalize(component.name);

    if (name && (counts.get(name) ?? 0) > 1 && !errors[index].name) {
      errors[index].name = DUPLICATE_COMPONENT_NAME_MESSAGE;
    }
  });

  return errors;
};

interface ISystemComponentErrorsContextValue {
  show: boolean;
  errors: ISystemComponentErrors[];
}

const SystemComponentErrorsContext = createContext<ISystemComponentErrorsContextValue | null>(null);

export const SystemComponentErrorsProvider = SystemComponentErrorsContext.Provider;

const GroupHeading = ({ children }: { children: string }) => (
  <Typography
    component="h4"
    variant="subtitle2"
    sx={{ mt: 1, pb: 0.5, fontWeight: 600, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' }}
  >
    {children}
  </Typography>
);

export const SystemComponentFields = ({ value, onChange, index }: IFieldArrayEntryProps<ISystemComponentValue>) => {
  const context = useContext(SystemComponentErrorsContext);
  const errors = context?.show ? context.errors[index] : undefined;
  const idBase = `systemComponent-${index}`;

  const { data: sourceLocations } = useGetSourceLocations();
  const { data: feeCategories } = useGetFeeCategories();

  const sourceOptions = useMemo(() => {
    const names = (sourceLocations ?? []).map(item => item.name).filter((name): name is string => Boolean(name));

    return value.sourceLocation && !names.includes(value.sourceLocation) ? [...names, value.sourceLocation] : names;
  }, [sourceLocations, value.sourceLocation]);

  const feeOptions = useMemo(() => {
    const names = (feeCategories ?? []).map(item => item.name).filter((name): name is string => Boolean(name));

    return value.feeCategory && !names.includes(value.feeCategory) ? [...names, value.feeCategory] : names;
  }, [feeCategories, value.feeCategory]);

  const update = (field: keyof ISystemComponentValue) => (fieldValue: string) =>
    onChange({ ...value, [field]: fieldValue });

  return (
    <Stack spacing={2.5}>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
        {`Компонент ${index + 1}`}
      </Typography>

      <FormSection columns={2}>
        <FormRow>
          <GroupHeading>Основни данни</GroupHeading>
        </FormRow>
        <ValidatedTextField
          id={`${idBase}-name`}
          name={`${idBase}-name`}
          label="Име"
          value={value.name}
          onValueChange={update('name')}
          error={errors?.name}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />
        <ValidatedTextField
          id={`${idBase}-kind`}
          name={`${idBase}-kind`}
          label="Вид"
          value={value.kind}
          onValueChange={update('kind')}
          error={errors?.kind}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />

        <FormRow>
          <GroupHeading>Ценообразуване</GroupHeading>
        </FormRow>
        <TextField
          select
          id={`${idBase}-priceUnit`}
          name={`${idBase}-priceUnit`}
          label="Мерна единица за цена"
          value={value.priceUnit}
          onChange={event => update('priceUnit')(event.target.value)}
          error={Boolean(errors?.priceUnit)}
          helperText={errors?.priceUnit}
          fullWidth
        >
          {PRICE_UNIT_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {value.priceUnit === ProductPriceUnit.m2 ? (
          <ValidatedTextField
            id={`${idBase}-pricePerSquareMeter`}
            name={`${idBase}-pricePerSquareMeter`}
            label="Цена на м²"
            type="number"
            value={value.pricePerSquareMeter}
            onValueChange={update('pricePerSquareMeter')}
            error={errors?.pricePerSquareMeter}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            fullWidth
          />
        ) : (
          <ValidatedTextField
            id={`${idBase}-rawUnitPrice`}
            name={`${idBase}-rawUnitPrice`}
            label="Единична цена"
            type="number"
            value={value.rawUnitPrice}
            onValueChange={update('rawUnitPrice')}
            error={errors?.rawUnitPrice}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            fullWidth
          />
        )}
        <TextField
          select
          id={`${idBase}-feeCategory`}
          name={`${idBase}-feeCategory`}
          label="Категория надценка"
          value={value.feeCategory}
          onChange={event => update('feeCategory')(event.target.value)}
          error={Boolean(errors?.feeCategory)}
          helperText={errors?.feeCategory}
          fullWidth
        >
          {feeOptions.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <FormRow>
          <GroupHeading>Опаковка и количества</GroupHeading>
        </FormRow>
        <ValidatedTextField
          id={`${idBase}-countPerPallet`}
          name={`${idBase}-countPerPallet`}
          label="Брой в палет"
          type="number"
          value={value.countPerPallet}
          onValueChange={update('countPerPallet')}
          error={errors?.countPerPallet}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          fullWidth
        />
        <ValidatedTextField
          id={`${idBase}-minimumOrderUnits`}
          name={`${idBase}-minimumOrderUnits`}
          label="Минимално количество"
          type="number"
          value={value.minimumOrderUnits}
          onValueChange={update('minimumOrderUnits')}
          error={errors?.minimumOrderUnits}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          fullWidth
        />
        <ValidatedTextField
          id={`${idBase}-unitsPerSquareMeter`}
          name={`${idBase}-unitsPerSquareMeter`}
          label="Брой на м²"
          type="number"
          value={value.unitsPerSquareMeter}
          onValueChange={update('unitsPerSquareMeter')}
          error={errors?.unitsPerSquareMeter}
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          fullWidth
        />
        <ValidatedTextField
          id={`${idBase}-palletWeightKg`}
          name={`${idBase}-palletWeightKg`}
          label="Тегло на палет (кг)"
          type="number"
          value={value.palletWeightKg}
          onValueChange={update('palletWeightKg')}
          error={errors?.palletWeightKg}
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          fullWidth
        />

        <FormRow>
          <GroupHeading>Произход</GroupHeading>
        </FormRow>
        <TextField
          select
          id={`${idBase}-sourceLocation`}
          name={`${idBase}-sourceLocation`}
          label="Производствена база"
          value={value.sourceLocation}
          onChange={event => update('sourceLocation')(event.target.value)}
          error={Boolean(errors?.sourceLocation)}
          helperText={errors?.sourceLocation}
          fullWidth
        >
          {sourceOptions.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <ValidatedTextField
          id={`${idBase}-sapNumber`}
          name={`${idBase}-sapNumber`}
          label="SAP номер"
          value={value.sapNumber}
          onValueChange={update('sapNumber')}
          error={errors?.sapNumber}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />
      </FormSection>
    </Stack>
  );
};
