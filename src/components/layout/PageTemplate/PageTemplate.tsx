import Typography from '@mui/material/Typography';
import Head from 'next/head';

import { Footer } from '../Footer';
import { Header } from '../Header';
import { NavDrawerProvider } from '../NavDrawer';

import type { IPageTemplateProps } from './types';

import styles from './pageTemplate.module.scss';

const SITE_NAME = 'Wienerberger';

export const PageTemplate = ({ title, heading, children, internal, bare }: IPageTemplateProps) => {
  const body = (
    <div className={styles.content}>
      {typeof heading === 'string' ? (
        <Typography variant="h4" component="h1" className={styles.heading}>
          {heading}
        </Typography>
      ) : (
        heading
      )}
      {children}
    </div>
  );

  const renderBody = () => {
    if (bare) {
      return (
        <>
          <Header bare />
          <main className={styles.main}>{body}</main>
        </>
      );
    }

    if (internal) {
      return (
        <>
          <Header internal />
          <main className={styles.main}>{body}</main>
        </>
      );
    }

    return (
      <NavDrawerProvider>
        <Header />
        <main className={styles.main}>{body}</main>
        <Footer />
      </NavDrawerProvider>
    );
  };

  return (
    <div className={styles.root}>
      <Head>
        <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
      </Head>
      {renderBody()}
    </div>
  );
};
