import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import { PageTemplate } from '@/components/layout/PageTemplate';
import { getErrorContent } from '@/content/errors';

import type { IErrorPageProps } from './types';

import styles from './errorPage.module.scss';

export const ErrorPage = ({ statusCode }: IErrorPageProps) => {
  const content = getErrorContent(statusCode);

  return (
    <PageTemplate title={content.title}>
      <div className={styles.root}>
        <Typography component="p" className={styles.code}>
          {content.statusCode}
        </Typography>
        <Typography variant="h4" component="h1" className={styles.title}>
          {content.title}
        </Typography>
        <Typography component="p" className={styles.description}>
          {content.description}
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Към началната страница
        </Button>
      </div>
    </PageTemplate>
  );
};
