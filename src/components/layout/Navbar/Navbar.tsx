import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import Link from 'next/link';
import { Fragment, useState } from 'react';

import { useLogout } from '@/hooks';
import { useSingleLineOverflow } from '@/hooks/useSingleLineOverflow';

import { internalNavbarGroups, isNavbarLinkGroup } from '../navigation';

import { NavbarSection } from './NavbarSection';

import styles from './navbar.module.scss';

export const Navbar = () => {
  const { ref, isOverflowing } = useSingleLineOverflow<HTMLUListElement>();
  const [open, setOpen] = useState(false);
  const { logout, isLoggingOut } = useLogout();
  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    void logout();
  };

  return (
    <nav className={styles.navbar} aria-label="Основна навигация">
      <ul
        ref={ref}
        className={`${styles.sectionRow}${isOverflowing ? ` ${styles.sectionRowHidden}` : ''}`}
        aria-hidden={isOverflowing || undefined}
      >
        {internalNavbarGroups.map(group =>
          isNavbarLinkGroup(group) ? (
            <li key={group.label} className={styles.section}>
              <Link href={group.href} className={styles.trigger}>
                {group.label}
              </Link>
            </li>
          ) : (
            <NavbarSection key={group.label} group={group} />
          )
        )}
      </ul>
      <div className={styles.actions}>
        {isOverflowing ? (
          <IconButton className={styles.hamburger} onClick={() => setOpen(true)} aria-label="Отвори навигацията">
            <MenuIcon />
          </IconButton>
        ) : (
          <Button
            className={styles.logout}
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outlined"
            startIcon={<LogoutIcon />}
            sx={{
              color: '#fff',
              borderColor: 'rgb(255 255 255 / 60%)',
              '&:hover': { borderColor: '#fff', backgroundColor: 'rgb(255 255 255 / 15%)' },
            }}
          >
            Изход
          </Button>
        )}
      </div>
      <Drawer anchor="right" open={open} onClose={close}>
        <div className={styles.drawer}>
          <List className={styles.drawerList}>
            {internalNavbarGroups.map(group =>
              isNavbarLinkGroup(group) ? (
                <ListItem key={group.label} disablePadding>
                  <ListItemButton component={Link} href={group.href} className={styles.drawerTopLink} onClick={close}>
                    {group.label}
                  </ListItemButton>
                </ListItem>
              ) : (
                <Fragment key={group.label}>
                  <ListSubheader disableSticky className={styles.drawerGroup}>
                    {group.label}
                  </ListSubheader>
                  {group.subsections.map(subsection => (
                    <Fragment key={subsection.label}>
                      <ListSubheader disableSticky className={styles.drawerSubheading}>
                        {subsection.label}
                      </ListSubheader>
                      {subsection.items.map(item => (
                        <ListItem key={item.label} disablePadding>
                          <ListItemButton
                            component={Link}
                            href={item.href}
                            className={styles.drawerItem}
                            onClick={close}
                          >
                            {item.label}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              )
            )}
          </List>
          <Divider />
          <div className={styles.drawerFooter}>
            <Button
              fullWidth
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outlined"
              startIcon={<LogoutIcon />}
            >
              Изход
            </Button>
          </div>
        </div>
      </Drawer>
    </nav>
  );
};
