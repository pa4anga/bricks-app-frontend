import type { ISelectButtonProps } from '../SelectButton/types';

export interface ISearchableSelectButtonProps<T> extends ISelectButtonProps<T> {
  minSearchLength?: number;
  searchPlaceholder?: string;
}
