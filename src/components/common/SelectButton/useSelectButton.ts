import { useImperativeHandle, useState } from 'react';
import type { MouseEvent } from 'react';

import type { IUseSelectButtonParams } from './types';

export const defaultGetLabel = (item: unknown): string => String(item);

export const useSelectButton = <T>({
  items,
  initialLabel,
  getLabel,
  setSelected,
  onSet,
  onReset,
  ref,
}: IUseSelectButtonParams<T>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selected, setSelectedValue] = useState<T | null>(null);
  const [label, setLabel] = useState(initialLabel);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (item: T) => {
    setSelectedValue(item);
    setLabel(getLabel(item));
    setSelected?.(item);
    onSet?.(item);
    closeMenu();
  };

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        setSelectedValue(null);
        setLabel(initialLabel);
        setAnchorEl(null);
        setSelected?.(null);
        onReset?.();
      },
      getValue: () => selected,
      getItems: () => items,
      showSelection: (item: T) => {
        setSelectedValue(item);
        setLabel(getLabel(item));
      },
    }),
    [selected, items, initialLabel, getLabel, setSelected, onReset]
  );

  return { anchorEl, selected, label, openMenu, closeMenu, handleSelect };
};
