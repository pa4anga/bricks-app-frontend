import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

import type { INavbarDropdownGroup } from '../navigation';

import styles from './navbar.module.scss';

interface INavbarSectionProps {
  group: INavbarDropdownGroup;
}

export const NavbarSection = ({ group }: INavbarSectionProps) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  const handleBlur = (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      hide();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Escape') {
      hide();
    }
  };

  return (
    <li
      className={styles.section}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={anchorRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(previous => !previous)}
      >
        {group.label}
      </button>
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" className={styles.popper} disablePortal>
        <Paper id={menuId} className={styles.dropdown} elevation={3}>
          {group.subsections.map(subsection => (
            <div key={subsection.label} className={styles.dropdownGroup}>
              <div className={styles.dropdownSubheading}>{subsection.label}</div>
              <MenuList disablePadding>
                {subsection.items.map(item => (
                  <MenuItem
                    key={item.label}
                    component={Link}
                    href={item.href}
                    className={styles.dropdownItem}
                    onClick={hide}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </MenuList>
            </div>
          ))}
        </Paper>
      </Popper>
    </li>
  );
};
