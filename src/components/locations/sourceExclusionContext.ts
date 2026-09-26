import { createContext, useContext } from 'react';

export interface ISourceExclusionContextValue {
  options: string[];
  selectedSources: string[];
}

export const SourceExclusionContext = createContext<ISourceExclusionContextValue>({
  options: [],
  selectedSources: [],
});

export const useSourceExclusion = () => useContext(SourceExclusionContext);
