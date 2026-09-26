import { createContext, useContext } from 'react';

import type { IFormContextValue } from './types';

export const FormContext = createContext<IFormContextValue | null>(null);

export const useFormContext = (): IFormContextValue => {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error('Form fields such as <TextBox> must be rendered inside a <Form>.');
  }

  return context;
};
