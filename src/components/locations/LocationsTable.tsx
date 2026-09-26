import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useMemo, useState } from 'react';

import { useDeleteLocationsId } from '@/api/endpoints/locations/locations';
import type { Location } from '@/api/model';
import { PaginatedTable, TableActionsMenu } from '@/components/common';
import type { IPaginatedTableColumn, ITableActionItem } from '@/components/common';
import { INTERNAL_LOCATION_EDIT_ROUTE } from '@/constants/routes';

const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на локацията.';
const EMPTY_CELL = '—';

interface ILocationRowActionsProps {
  location: Location;
  onDeleted: () => void;
}

const LocationRowActions = ({ location, onDeleted }: ILocationRowActionsProps) => {
  const id = location._id ?? '';
  const name = location.name ?? '';
  const { trigger, isMutating } = useDeleteLocationsId(id);
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
    { key: 'edit', label: 'Промени', href: INTERNAL_LOCATION_EDIT_ROUTE(id), ariaLabel: `Промени ${name}` },
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

interface ILocationsTableProps {
  locations: Location[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onDeleted: () => void;
}

export const LocationsTable = ({ locations, page, pageCount, onPageChange, onDeleted }: ILocationsTableProps) => {
  const priceSources = useMemo(
    () =>
      Array.from(new Set(locations.flatMap(location => (location.prices ?? []).map(entry => entry.source)))).sort(
        (first, second) => first.localeCompare(second)
      ),
    [locations]
  );

  const columns: IPaginatedTableColumn<Location>[] = [
    { key: 'name', header: 'Име', render: location => location.name },
    { key: 'municipality', header: 'Община', render: location => location.municipality ?? EMPTY_CELL },
    {
      key: 'postcode',
      header: 'Пощенски код',
      align: 'right',
      render: location => location.postcode ?? EMPTY_CELL,
    },
    { key: 'salesWbRegion', header: 'Търговски регион', render: location => location.salesWbRegion ?? EMPTY_CELL },
    { key: 'sapRegion', header: 'SAP регион', render: location => location.sapRegion ?? EMPTY_CELL },
    ...priceSources.map<IPaginatedTableColumn<Location>>(source => ({
      key: `price:${source}`,
      header: source,
      align: 'right',
      render: location => {
        const entry = location.prices?.find(price => price.source === source);

        return entry ? entry.price : EMPTY_CELL;
      },
    })),
    {
      key: 'actions',
      header: 'Действия',
      align: 'right',
      render: location => <LocationRowActions location={location} onDeleted={onDeleted} />,
    },
  ];

  return (
    <PaginatedTable
      columns={columns}
      rows={locations}
      getRowKey={location => location._id ?? location.name ?? ''}
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
      ariaLabel="Локации"
    />
  );
};
