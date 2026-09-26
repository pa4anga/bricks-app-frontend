import { z } from 'zod';

import { ProductPriceUnit } from '@/api/model';

export const MAX_100_MESSAGE = 'Полето може да е най-много 100 символа.';
export const MAX_500_MESSAGE = 'Полето може да е най-много 500 символа.';

export const RAW_UNIT_PRICE_MESSAGE = 'Въведете единична цена (число, по-голямо от 0).';
export const PRICE_PER_SQUARE_METER_MESSAGE = 'Въведете цена на м² (число, по-голямо от 0).';
export const PRICE_UNIT_MESSAGE = 'Изберете мерна единица за цена.';

const POSITIVE_NUMBER_PATTERN = /^\d+(\.\d+)?$/;

export const numberToString = (value: number | undefined) => (value === undefined ? '' : String(value));

export const isPositiveNumberString = (value: string): boolean =>
  POSITIVE_NUMBER_PATTERN.test(value) && Number(value) > 0;

export const requiredText = (message: string, max = 100, maxMessage = MAX_100_MESSAGE) =>
  z.string().trim().min(1, message).max(max, maxMessage);

export const optionalText = (max = 100, maxMessage = MAX_100_MESSAGE) => z.string().trim().max(max, maxMessage);

export const requiredSelection = (message: string) => z.string().min(1, message);

export const positiveInteger = (message: string) =>
  z
    .string()
    .min(1, message)
    .regex(/^\d+$/, message)
    .refine(value => Number(value) >= 1, message);

export const positiveNumber = (message: string) =>
  z
    .string()
    .min(1, message)
    .regex(POSITIVE_NUMBER_PATTERN, message)
    .refine(value => Number(value) > 0, message);

export const optionalPositiveNumber = (message: string) =>
  z.string().refine(value => value === '' || isPositiveNumberString(value), message);

export interface IPriceUnitOption {
  value: ProductPriceUnit;
  label: string;
}

export const PRICE_UNIT_OPTIONS: IPriceUnitOption[] = [
  { value: ProductPriceUnit.бр, label: 'бр.' },
  { value: ProductPriceUnit.m2, label: 'м²' },
];
