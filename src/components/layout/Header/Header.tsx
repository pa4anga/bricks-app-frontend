import Link from 'next/link';

import { Navbar } from '../Navbar';

import { HeaderMenuButton } from './HeaderMenuButton';

import styles from './header.module.scss';

interface IHeaderProps {
  internal?: boolean;
  bare?: boolean;
}

export const Header = ({ internal, bare }: IHeaderProps) => (
  <header className={styles.header}>
    <Link href="/" className={styles.logoBox} aria-label="Начало">
      <img src="/img/wienerberger_logo.svg" alt="Wienerberger" className={styles.logo} />
    </Link>
    {!bare && (internal ? <Navbar /> : <HeaderMenuButton />)}
  </header>
);
