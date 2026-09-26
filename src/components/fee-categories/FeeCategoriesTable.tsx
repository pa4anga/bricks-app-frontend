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

import { useDeleteFeeCategoriesName } from '@/api/endpoints/fee-categories/fee-categories';
import type { FeeCategory } from '@/api/model';
import { TableActionsMenu } from '@/components/common';
import type { ITableActionItem } from '@/components/common';
import { INTERNAL_FEE_CATEGORY_EDIT_ROUTE } from '@/constants/routes';

const DELETE_IN_USE_MESSAGE = 'Категорията надценка се използва от продукт и не може да бъде изтрита.';
const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на категорията надценка.';

interface IFeeCategoryRowProps {
  feeCategory: FeeCategory;
  onDeleted: () => void;
}

const FeeCategoryRow = ({ feeCategory, onDeleted }: IFeeCategoryRowProps) => {
  const name = feeCategory.name ?? '';
  const { trigger, isMutating } = useDeleteFeeCategoriesName(name);
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
    { key: 'edit', label: 'Промени', href: INTERNAL_FEE_CATEGORY_EDIT_ROUTE(name), ariaLabel: `Промени ${name}` },
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
      <TableCell>{feeCategory.name}</TableCell>
      <TableCell align="right">{feeCategory.percentage}%</TableCell>
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

interface IFeeCategoriesTableProps {
  feeCategories: FeeCategory[];
  onDeleted: () => void;
}

export const FeeCategoriesTable = ({ feeCategories, onDeleted }: IFeeCategoriesTableProps) => (
  <TableContainer component={Paper}>
    <Table aria-label="Категории надценка">
      <TableHead sx={{ '& .MuiTableCell-head': { backgroundColor: 'primary.main', color: 'common.white' } }}>
        <TableRow>
          <TableCell>Име</TableCell>
          <TableCell align="right">Процент</TableCell>
          <TableCell align="right">Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {feeCategories.map(feeCategory => (
          <FeeCategoryRow key={feeCategory._id ?? feeCategory.name} feeCategory={feeCategory} onDeleted={onDeleted} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
