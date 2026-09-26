import type { ISearchableSelectButtonProps } from '@/components/common';

export type IFormSelectProps<T> = Omit<ISearchableSelectButtonProps<T>, 'setSelected'> & {
  name: string;
};
