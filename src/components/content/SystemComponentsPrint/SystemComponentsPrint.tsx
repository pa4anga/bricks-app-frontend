import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { getPriceColumnVisibility, MISSING_PRICE } from '../SystemComponentsTable/systemComponentRows';

import type { ISystemComponentsPrintProps } from './types';

import styles from './systemComponentsPrint.module.scss';

const PRINT_ACTIVE_CLASS = 'offerPrintActive';

export const SystemComponentsPrint = ({ productName, groups }: ISystemComponentsPrintProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add(PRINT_ACTIVE_CLASS);
    return () => {
      document.documentElement.classList.remove(PRINT_ACTIVE_CLASS);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const { showPricePerUnit, showPricePerSquareMeter } = getPriceColumnVisibility(groups);
  const columnCount = 1 + (showPricePerUnit ? 1 : 0) + (showPricePerSquareMeter ? 1 : 0);

  return createPortal(
    <div className={styles.sheet} aria-hidden="true">
      <div className={styles.logoRow}>
        <img src="/img/wienerberger_logo.svg" alt="Wienerberger" className={styles.logo} />
      </div>

      <hr className={styles.rule} />

      {productName && <h1 className={styles.title}>{productName}</h1>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Продукт</th>
            {showPricePerUnit && <th className={`${styles.th} ${styles.priceCol}`}>Цена за брой</th>}
            {showPricePerSquareMeter && <th className={`${styles.th} ${styles.priceCol}`}>Цена за м²</th>}
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <Fragment key={group.label}>
              <tr>
                <td className={styles.groupCell} colSpan={columnCount}>
                  {group.label}
                </td>
              </tr>
              {group.rows.map((row, index) => (
                <tr key={`${group.label}-${index}`}>
                  <td className={styles.cell}>{row.label}</td>
                  {showPricePerUnit && (
                    <td className={`${styles.cell} ${styles.priceCol}`}>{row.pricePerUnit ?? MISSING_PRICE}</td>
                  )}
                  {showPricePerSquareMeter && (
                    <td className={`${styles.cell} ${styles.priceCol}`}>{row.pricePerSquareMeter ?? MISSING_PRICE}</td>
                  )}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>,
    document.body
  );
};
