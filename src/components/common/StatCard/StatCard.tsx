import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import type { IStatCardProps } from './types';

import styles from './statCard.module.scss';

const EMPTY_VALUE = '—';

const formatValue = (value: number | undefined, isError: boolean) => {
  if (isError || value === undefined) {
    return EMPTY_VALUE;
  }

  return value.toLocaleString('bg-BG');
};

export const StatCard = ({ label, value, isLoading, isError = false }: IStatCardProps) => (
  <Card elevation={3} sx={{ borderRadius: '12px', height: '100%' }}>
    <CardContent className={styles.content}>
      <Typography variant="subtitle2" component="h2" className={styles.label}>
        {label}
      </Typography>
      {isLoading ? (
        <Skeleton variant="rounded" width={80} height={44} aria-label="Зареждане" />
      ) : (
        <Typography variant="h3" component="p" className={styles.value}>
          {formatValue(value, isError)}
        </Typography>
      )}
    </CardContent>
  </Card>
);
