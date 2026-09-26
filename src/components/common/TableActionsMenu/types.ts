export type TableActionColor = 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export interface ITableActionItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  color?: TableActionColor;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface ITableActionsMenuProps {
  actions: ITableActionItem[];
  ariaLabel?: string;
}
