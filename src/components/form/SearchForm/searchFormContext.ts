import { createContext, useContext } from 'react';

import type { ISearchFormState } from './types';

export const SearchFormContext = createContext<ISearchFormState | null>(null);

export const useSearchResults = (): ISearchFormState => {
  const context = useContext(SearchFormContext);

  if (!context) {
    throw new Error('useSearchResults must be used within a <SearchForm>.');
  }

  return context;
};
