import { createContext, useContext } from 'react';
import type { RefObject } from 'react';

export interface INavDrawerContext {
  listRef: RefObject<HTMLUListElement | null>;
  isOverflowing: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const NavDrawerContext = createContext<INavDrawerContext | null>(null);

export const useNavDrawer = (): INavDrawerContext => {
  const context = useContext(NavDrawerContext);

  if (!context) {
    throw new Error('useNavDrawer must be used within a NavDrawerProvider.');
  }

  return context;
};
