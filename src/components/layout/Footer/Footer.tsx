import Link from 'next/link';

import { useNavDrawer } from '../navDrawerContext';
import { navLinks } from '../navigation';

import styles from './footer.module.scss';

export const Footer = () => {
  const { listRef, isOverflowing } = useNavDrawer();

  return (
    <footer className={`${styles.footer}${isOverflowing ? ` ${styles.footerCollapsed}` : ''}`}>
      <div className={styles.inner}>
        <nav aria-label="Долна навигация" aria-hidden={isOverflowing || undefined}>
          <ul ref={listRef} className={`${styles.list}${isOverflowing ? ` ${styles.collapsed}` : ''}`}>
            {navLinks.map(link => (
              <li key={link.href} className={styles.item}>
                {link.external ? (
                  <a href={link.href} className={styles.link} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
};
