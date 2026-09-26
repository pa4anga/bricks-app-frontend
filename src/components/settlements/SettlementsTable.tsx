import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';

import { useDeleteSettlementsId } from '@/api/endpoints/settlements/settlements';
import type { Settlement } from '@/api/model';
import { PaginatedTable, TableActionsMenu } from '@/components/common';
import type { IPaginatedTableColumn, ITableActionItem } from '@/components/common';
import { INTERNAL_SETTLEMENT_EDIT_ROUTE } from '@/constants/routes';

const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на населеното място.';

interface ISettlementRowActionsProps {
  settlement: Settlement;
  onDeleted: () => void;
}

const SettlementRowActions = ({ settlement, onDeleted }: ISettlementRowActionsProps) => {
  const id = settlement._id ?? '';
  const name = settlement.name ?? '';
  const { trigger, isMutating } = useDeleteSettlementsId(id);
  const [error, setError] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const closeError = () => setError(previous => ({ ...previous, open: false }));

  const handleDelete = async () => {
    closeError();

    try {
      await trigger();
      onDeleted();
    } catch {
      setError({ open: true, message: DELETE_FAILED_MESSAGE });
    }
  };

  const actions: ITableActionItem[] = [
    { key: 'edit', label: 'Промени', href: INTERNAL_SETTLEMENT_EDIT_ROUTE(name), ariaLabel: `Промени ${name}` },
    {
      key: 'delete',
      label: 'Изтрий',
      color: 'error',
      disabled: isMutating,
      ariaLabel: `Изтрий ${name}`,
      onClick: () => {
        void handleDelete();
      },
    },
  ];

  return (
    <>
      <TableActionsMenu actions={actions} ariaLabel={`Действия за ${name}`} />
      <Snackbar open={error.open} autoHideDuration={5000} onClose={closeError}>
        <Alert severity="error" onClose={closeError} sx={{ width: '100%' }}>
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const formatCoordinate = (value: number | undefined) => (value === undefined ? '—' : value);

interface ISettlementsTableProps {
  settlements: Settlement[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onDeleted: () => void;
}

export const SettlementsTable = ({ settlements, page, pageCount, onPageChange, onDeleted }: ISettlementsTableProps) => {
  const columns: IPaginatedTableColumn<Settlement>[] = [
    { key: 'name', header: 'Име', render: settlement => settlement.name },
    {
      key: 'latitude',
      header: 'Географска ширина',
      align: 'right',
      render: settlement => formatCoordinate(settlement.coordinates?.coordinates?.[1]),
    },
    {
      key: 'longitude',
      header: 'Географска дължина',
      align: 'right',
      render: settlement => formatCoordinate(settlement.coordinates?.coordinates?.[0]),
    },
    {
      key: 'actions',
      header: 'Действия',
      align: 'right',
      render: settlement => <SettlementRowActions settlement={settlement} onDeleted={onDeleted} />,
    },
  ];

  return (
    <PaginatedTable
      ariaLabel="Населени места"
      columns={columns}
      rows={settlements}
      getRowKey={settlement => settlement._id ?? settlement.name ?? ''}
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
  );
};
