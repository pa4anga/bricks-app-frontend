import { useEffect } from 'react';

import { SearchableSelectButton } from '@/components/common';

import { useFormContext } from '../Form/formContext';

import type { IFormSelectProps } from './types';

export const FormSelect = <T,>({ name, ref, ...rest }: IFormSelectProps<T>) => {
  const { registerField, setFieldValue } = useFormContext();

  useEffect(() => {
    registerField(name);
  }, [registerField, name]);

  const handleSelected = (item: T | null) => {
    setFieldValue(name, item);
  };

  return <SearchableSelectButton {...rest} ref={ref} setSelected={handleSelected} />;
};
