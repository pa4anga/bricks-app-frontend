import Typography from '@mui/material/Typography';

import type { SystemComponent } from '@/api/model';

import styles from './systemComponentCard.module.scss';

interface ISystemComponentField {
  key: keyof SystemComponent;
  label: string;
  suffix?: string;
}

const COMPONENT_FIELDS: ISystemComponentField[] = [
  { key: 'kind', label: 'Вид' },
  { key: 'rawUnitPrice', label: 'Единична цена' },
  { key: 'countPerPallet', label: 'Брой в палет' },
  { key: 'minimumOrderUnits', label: 'Минимално количество' },
  { key: 'unitsPerSquareMeter', label: 'Брой на м²' },
  { key: 'unitWeightKg', label: 'Тегло за брой', suffix: ' кг' },
  { key: 'palletWeightKg', label: 'Тегло на палет', suffix: ' кг' },
  { key: 'weightPerSquareMeter', label: 'Тегло на м²', suffix: ' кг' },
  { key: 'pricePerSquareMeter', label: 'Цена на м²' },
  { key: 'sourceLocation', label: 'Производствена база' },
  { key: 'sapNumber', label: 'SAP номер' },
  { key: 'feeCategory', label: 'Категория надценка' },
];

interface ISystemComponentCardProps {
  component: SystemComponent;
}

export const SystemComponentCard = ({ component }: ISystemComponentCardProps) => {
  const name = component.name ?? '';

  return (
    <div className={styles.card}>
      {name && (
        <Typography component="h4" className={styles.title}>
          {name}
        </Typography>
      )}

      <div className={styles.specList}>
        {COMPONENT_FIELDS.map(field => {
          const value: unknown = component[field.key];

          if (value === null || value === undefined || value === '') {
            return null;
          }

          return (
            <Typography key={field.key} className={styles.specItem}>
              <strong>{field.label}:</strong> {`${String(value)}${field.suffix ?? ''}`}
            </Typography>
          );
        })}
      </div>
    </div>
  );
};
