import TextField from '@mui/material/TextField';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';

import type { IValidatedTextFieldProps } from './types';

export const ValidatedTextField = ({
  hint,
  error,
  schema,
  validateOn = 'change',
  value,
  defaultValue,
  onChange,
  onBlur,
  onValueChange,
  ref,
  ...rest
}: IValidatedTextFieldProps) => {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState(() => String(value ?? defaultValue ?? ''));
  const [hintState, setHintState] = useState(hint);
  const [errorState, setErrorState] = useState(error);

  const valueRef = useRef(String(value ?? defaultValue ?? ''));

  useEffect(() => {
    setHintState(hint);
  }, [hint]);

  useEffect(() => {
    setErrorState(error);
  }, [error]);

  useEffect(() => {
    if (isControlled) {
      valueRef.current = String(value ?? '');
    }
  }, [isControlled, value]);

  const runValidation = useCallback(
    (candidate: string) => {
      if (!schema) {
        return true;
      }

      const result = schema.safeParse(candidate);
      setErrorState(result.success ? undefined : result.error.issues[0]?.message);

      return result.success;
    },
    [schema]
  );

  useImperativeHandle(
    ref,
    () => ({
      setHint: next => setHintState(next),
      setError: next => setErrorState(next),
      clearError: () => setErrorState(undefined),
      validate: () => runValidation(valueRef.current),
    }),
    [runValidation]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = event.target.value;

    if (!isControlled) {
      setInternalValue(next);
    }

    valueRef.current = next;

    if (validateOn === 'change') {
      runValidation(next);
    }

    onChange?.(event);
    onValueChange?.(next);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (validateOn === 'blur') {
      runValidation(valueRef.current);
    }

    onBlur?.(event);
  };

  return (
    <TextField
      {...rest}
      value={isControlled ? value : internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={Boolean(errorState)}
      helperText={errorState ?? hintState}
    />
  );
};
