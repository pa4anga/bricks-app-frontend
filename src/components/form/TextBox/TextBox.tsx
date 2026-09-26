import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';

import { useFormContext } from '../Form/formContext';

import type { ITextBoxProps } from './types';

export const TextBox = ({ name, helperText, onBlur, ...rest }: ITextBoxProps) => {
  const { getFieldValue, getFieldError, setFieldValue, setFieldTouched, registerField } = useFormContext();

  useEffect(() => {
    registerField(name);
  }, [registerField, name]);

  const error = getFieldError(name);
  const value = getFieldValue(name);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFieldValue(name, event.target.value);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFieldTouched(name);
    onBlur?.(event);
  };

  return (
    <TextField
      {...rest}
      name={name}
      value={value ?? ''}
      onChange={handleChange}
      onBlur={handleBlur}
      error={Boolean(error)}
      helperText={error ?? helperText}
    />
  );
};
