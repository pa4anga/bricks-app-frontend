import Stack from '@mui/material/Stack';
import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { z } from 'zod';

import { FormContext } from './formContext';
import type { IFormContextValue, IFormProps } from './types';

export const Form = <TSchema extends z.ZodType>({
  schema,
  onSubmit,
  initialValues,
  spacing = 2,
  direction = 'column',
  className,
  children,
}: IFormProps<TSchema>) => {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...(initialValues as Record<string, unknown> | undefined),
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitCount, setSubmitCount] = useState(0);

  const errors = useMemo<Record<string, string>>(() => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {};
    }

    const fieldErrors: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const key = issue.path[0];

      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message;
      }
    }

    return fieldErrors;
  }, [schema, values]);

  const registerField = useCallback((name: string) => {
    setValues(previous => (name in previous ? previous : { ...previous, [name]: '' }));
  }, []);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues(previous => ({ ...previous, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name: string) => {
    setTouched(previous => (previous[name] ? previous : { ...previous, [name]: true }));
  }, []);

  const contextValue = useMemo<IFormContextValue>(
    () => ({
      getFieldValue: name => values[name],
      getFieldError: name => (touched[name] || submitCount > 0 ? errors[name] : undefined),
      registerField,
      setFieldValue,
      setFieldTouched,
    }),
    [values, touched, submitCount, errors, registerField, setFieldValue, setFieldTouched]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitCount(count => count + 1);

    const result = schema.safeParse(values);

    if (result.success) {
      await onSubmit(result.data);
    }
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={className} noValidate>
        <Stack direction={direction} spacing={spacing}>
          {children}
        </Stack>
      </form>
    </FormContext.Provider>
  );
};
