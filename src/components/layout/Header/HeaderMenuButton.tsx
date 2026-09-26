import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

import { useNavDrawer } from '../navDrawerContext';

import styles from './header.module.scss';

export const HeaderMenuButton = () => {
  const { isOverflowing, open } = useNavDrawer();

  if (!isOverflowing) {
    return null;
  }

  return (
    <IconButton className={styles.menuButton} onClick={open} aria-label="Отвори навигацията">
      <MenuIcon />
    </IconButton>
  );
};
