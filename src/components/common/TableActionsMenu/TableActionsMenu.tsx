import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from 'next/link';
import { useId, useState } from 'react';
import type { MouseEvent } from 'react';

import type { ITableActionItem, ITableActionsMenuProps } from './types';

const DEFAULT_LABEL = 'Действия';

const getColorSx = (color: ITableActionItem['color']) =>
  color && color !== 'inherit' ? { color: `${color}.main` } : undefined;

export const TableActionsMenu = ({ actions, ariaLabel = DEFAULT_LABEL }: ITableActionsMenuProps) => {
  const buttonId = useId();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (action: ITableActionItem) => () => {
    closeMenu();
    action.onClick?.();
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        id={buttonId}
        size="small"
        onClick={openMenu}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        MenuListProps={{ 'aria-labelledby': buttonId }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actions.map(action => {
          const colorSx = getColorSx(action.color);

          return action.href ? (
            <MenuItem
              key={action.key}
              component={Link}
              href={action.href}
              onClick={closeMenu}
              disabled={action.disabled}
              aria-label={action.ariaLabel}
              sx={colorSx}
            >
              {action.label}
            </MenuItem>
          ) : (
            <MenuItem
              key={action.key}
              onClick={handleSelect(action)}
              disabled={action.disabled}
              aria-label={action.ariaLabel}
              sx={colorSx}
            >
              {action.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
