import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { useDeleteSourceLocationsName } from '@/api/endpoints/source-locations/source-locations';
import type { SourceLocation } from '@/api/model';
import { TableActionsMenu } from '@/components/common';
import type { ITableActionItem } from '@/components/common';
import { INTERNAL_SOURCE_LOCATION_EDIT_ROUTE } from '@/constants/routes';

const DELETE_IN_USE_MESSAGE = 'Производствената база се използва от продукт и не може да бъде изтрита.';
const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на производствената база.';

interface ISourceLocationRowProps {
  sourceLocation: SourceLocation;
  onDeleted: () => void;
}

const SourceLocationRow = ({ sourceLocation, onDeleted }: ISourceLocationRowProps) => {
  const name = sourceLocation.name ?? '';
  const { trigger, isMutating } = useDeleteSourceLocationsName(name);
  const [error, setError] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const closeError = () => setError(previous => ({ ...previous, open: false }));

  const handleDelete = async () => {
    closeError();

    try {
      await trigger();
      onDeleted();
    } catch (caught) {
      const message =
        isAxiosError(caught) && caught.response?.status === 409 ? DELETE_IN_USE_MESSAGE : DELETE_FAILED_MESSAGE;
      setError({ open: true, message });
    }
  };

  const actions: ITableActionItem[] = [
    { key: 'edit', label: 'Промени', href: INTERNAL_SOURCE_LOCATION_EDIT_ROUTE(name), ariaLabel: `Промени ${name}` },
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
    <TableRow>
      <TableCell>{sourceLocation.name}</TableCell>
      <TableCell align="right">{sourceLocation.truckCapacityKg}</TableCell>
      <TableCell align="right">
        <TableActionsMenu actions={actions} ariaLabel={`Действия за ${name}`} />
        <Snackbar open={error.open} autoHideDuration={5000} onClose={closeError}>
          <Alert severity="error" onClose={closeError} sx={{ width: '100%' }}>
            {error.message}
          </Alert>
        </Snackbar>
      </TableCell>
    </TableRow>
  );
};

interface ISourceLocationsTableProps {
  sourceLocations: SourceLocation[];
  onDeleted: () => void;
}

export const SourceLocationsTable = ({ sourceLocations, onDeleted }: ISourceLocationsTableProps) => (
  <TableContainer component={Paper}>
    <Table aria-label="Производствени бази">
      <TableHead sx={{ '& .MuiTableCell-head': { backgroundColor: 'primary.main', color: 'common.white' } }}>
        <TableRow>
          <TableCell>Име</TableCell>
          <TableCell align="right">Капацитет на камион (кг)</TableCell>
          <TableCell align="right">Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sourceLocations.map(sourceLocation => (
          <SourceLocationRow
            key={sourceLocation._id ?? sourceLocation.name}
            sourceLocation={sourceLocation}
            onDeleted={onDeleted}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
