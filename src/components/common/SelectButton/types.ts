import type { Key, Ref } from 'react';

export interface ISelectButtonHandle<T> {
  reset: () => void;
  getValue: () => T | null;
  getItems: () => T[];
  showSelection: (item: T) => void;
}

export interface ISelectButtonProps<T> {
  items: T[];
  initialLabel: string;
  getLabel?: (item: T) => string;
  getKey?: (item: T, index: number) => Key;
  setSelected?: (item: T | null) => void;
  onSet?: (item: T) => void;
  onReset?: () => void;
  maxHeight?: number | string;
  disabled?: boolean;
  ref?: Ref<ISelectButtonHandle<T>>;
}

export interface IUseSelectButtonParams<T> {
  items: T[];
  initialLabel: string;
  getLabel: (item: T) => string;
  setSelected?: (item: T | null) => void;
  onSet?: (item: T) => void;
  onReset?: () => void;
  ref?: Ref<ISelectButtonHandle<T>>;
}
