import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';

import { useDeleteAccountsId } from '@/api/endpoints/accounts/accounts';
import type { Account } from '@/api/model';
import { TableActionsMenu } from '@/components/common';
import type { ITableActionItem } from '@/components/common';

interface IAccountRowProps {
  account: Account;
  canDelete: boolean;
  onDeleted: () => void;
}

const AccountRow = ({ account, canDelete, onDeleted }: IAccountRowProps) => {
  const { trigger, isMutating } = useDeleteAccountsId(account.id);
  const [failed, setFailed] = useState(false);

  const handleDelete = async () => {
    setFailed(false);

    try {
      await trigger();
      onDeleted();
    } catch {
      setFailed(true);
    }
  };

  const actions: ITableActionItem[] = [
    {
      key: 'delete',
      label: 'Изтрий',
      color: 'error',
      disabled: isMutating,
      ariaLabel: `Изтрий ${account.username}`,
      onClick: () => {
        void handleDelete();
      },
    },
  ];

  return (
    <TableRow>
      <TableCell>{account.username}</TableCell>
      <TableCell align="right">
        {canDelete && (
          <>
            <TableActionsMenu actions={actions} ariaLabel={`Действия за ${account.username}`} />
            <Snackbar open={failed} autoHideDuration={5000} onClose={() => setFailed(false)}>
              <Alert severity="error" onClose={() => setFailed(false)} sx={{ width: '100%' }}>
                Неуспешно изтриване на акаунта.
              </Alert>
            </Snackbar>
          </>
        )}
      </TableCell>
    </TableRow>
  );
};

interface IAccountsTableProps {
  accounts: Account[];
  currentUsername: string;
  onDeleted: () => void;
}

export const AccountsTable = ({ accounts, currentUsername, onDeleted }: IAccountsTableProps) => (
  <TableContainer component={Paper}>
    <Table aria-label="Акаунти">
      <TableHead sx={{ '& .MuiTableCell-head': { backgroundColor: 'primary.main', color: 'common.white' } }}>
        <TableRow>
          <TableCell>Потребителско име</TableCell>
          <TableCell align="right">Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {accounts.map(account => (
          <AccountRow
            key={account.id}
            account={account}
            canDelete={accounts.length > 1 && account.username !== currentUsername}
            onDeleted={onDeleted}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
