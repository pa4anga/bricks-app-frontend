import type { NextPage } from 'next';

import { CategoryCard, PageTemplate } from '@/components';

import styles from './index.module.scss';

const CATEGORIES = [
  {
    title: 'Тухли и аксесоари',
    href: '/prices/bricks',
    imageSrc: '/img/categories/616359c4-db5d-413d-99e6-cb68a1d85bd5.webp',
  },
  {
    title: 'Настилки и аксесоари',
    href: '/prices/pavement',
    imageSrc: '/img/categories/cb33ae0e-62ac-403b-b6c9-f896868c3a8a.webp',
  },
  {
    title: 'Керемиди и аксесоари',
    href: '/prices/roof-tiles',
    imageSrc: '/img/categories/0b43e52e-f616-45ae-a26b-48bb4be63229.webp',
  },
] as const;

const HomePage: NextPage = () => (
  <PageTemplate title="Продуктови групи" heading="Продуктови групи">
    <div className={styles.grid}>
      {CATEGORIES.map(category => (
        <CategoryCard key={category.href} title={category.title} href={category.href} imageSrc={category.imageSrc} />
      ))}
    </div>
  </PageTemplate>
);

export default HomePage;
