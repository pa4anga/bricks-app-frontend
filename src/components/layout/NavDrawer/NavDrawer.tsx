import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { useSingleLineOverflow } from '@/hooks/useSingleLineOverflow';

import { NavDrawerContext } from '../navDrawerContext';
import { navLinks } from '../navigation';

import styles from './navDrawer.module.scss';

export interface INavDrawerProviderProps {
  children: ReactNode;
}

export const NavDrawerProvider = ({ children }: INavDrawerProviderProps) => {
  const { ref, isOverflowing } = useSingleLineOverflow<HTMLUListElement>();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <NavDrawerContext.Provider value={{ listRef: ref, isOverflowing, isOpen: open, open: () => setOpen(true), close }}>
      {children}
      <Drawer anchor="right" open={open} onClose={close}>
        <nav aria-label="Долна навигация" className={styles.drawerNav}>
          <List>
            {navLinks.map(link =>
              link.external ? (
                <ListItem key={link.href} disablePadding>
                  <ListItemButton
                    component="a"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    sx={{ color: 'primary.main' }}
                  >
                    {link.label}
                  </ListItemButton>
                </ListItem>
              ) : (
                <ListItem key={link.href} disablePadding>
                  <ListItemButton component={Link} href={link.href} onClick={close} sx={{ color: 'primary.main' }}>
                    {link.label}
                  </ListItemButton>
                </ListItem>
              )
            )}
          </List>
        </nav>
      </Drawer>
    </NavDrawerContext.Provider>
  );
};
