import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ValidatedTextField } from '@/components/form';

import { getPageWindow } from './getPageWindow';
import type { IPaginatedTableProps } from './types';

export const PaginatedTable = <T,>({
  columns,
  rows,
  getRowKey,
  page,
  pageCount,
  onPageChange,
  ariaLabel,
  windowSize = 10,
}: IPaginatedTableProps<T>) => {
  const [jumpValue, setJumpValue] = useState('');
  const [jumpError, setJumpError] = useState<string | undefined>(undefined);

  const pages = getPageWindow(page, pageCount, windowSize);

  const handleJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = Number(jumpValue);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > pageCount) {
      setJumpError(`Въведете страница между 1 и ${pageCount}.`);

      return;
    }

    setJumpError(undefined);
    setJumpValue('');
    onPageChange(parsed);
  };

  return (
    <Stack spacing={2}>
      <TableContainer component={Paper}>
        <Table aria-label={ariaLabel}>
          <TableHead sx={{ '& .MuiTableCell-head': { backgroundColor: 'primary.main', color: 'common.white' } }}>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.key} align={column.align}>
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={getRowKey(row)}>
                {columns.map(column => (
                  <TableCell key={column.key} align={column.align}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          aria-label="Първа страница"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          «
        </Button>
        {pages.map(number => (
          <Button
            key={number}
            size="small"
            variant={number === page ? 'contained' : 'outlined'}
            aria-label={`Страница ${number}`}
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPageChange(number)}
            sx={{ minWidth: 40 }}
          >
            {number}
          </Button>
        ))}
        <Button
          size="small"
          variant="outlined"
          aria-label="Последна страница"
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
        >
          »
        </Button>
      </Stack>

      <Box component="form" onSubmit={handleJump} noValidate>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="flex-start">
          <ValidatedTextField
            name="jump"
            label="Към страница"
            type="number"
            size="small"
            value={jumpValue}
            onValueChange={value => {
              setJumpValue(value);
              setJumpError(undefined);
            }}
            error={jumpError}
            sx={{ width: 160 }}
          />
          <Button type="submit" variant="outlined">
            Отиди
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};
