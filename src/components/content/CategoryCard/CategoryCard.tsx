import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import type { ICategoryCardProps } from './types';

import styles from './categoryCard.module.scss';

export const CategoryCard = ({ title, href, imageSrc, imageAlt }: ICategoryCardProps) => (
  <Card
    className={styles.card}
    elevation={6}
    sx={{ borderRadius: '20px', transition: 'box-shadow 0.3s ease', '&:hover': { boxShadow: 12 } }}
  >
    <CardActionArea component={Link} href={href} className={styles.actionArea} disableRipple>
      <CardMedia component="img" image={imageSrc} alt={imageAlt ?? ''} className={styles.media} />
      <div className={styles.caption}>
        <Typography variant="h5" component="h2" className={styles.title}>
          {title}
        </Typography>
      </div>
    </CardActionArea>
  </Card>
);
