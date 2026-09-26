import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Fragment } from 'react';

import { getPriceColumnVisibility, MISSING_PRICE } from './systemComponentRows';
import type { ISystemComponentsTableProps } from './types';

export const SystemComponentsTable = ({ groups }: ISystemComponentsTableProps) => {
  const { showPricePerUnit, showPricePerSquareMeter } = getPriceColumnVisibility(groups);
  const columnCount = 1 + (showPricePerUnit ? 1 : 0) + (showPricePerSquareMeter ? 1 : 0);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label="Системни компоненти" size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Продукт</TableCell>
            {showPricePerUnit && (
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Цена за брой
              </TableCell>
            )}
            {showPricePerSquareMeter && (
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Цена за м²
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map(group => (
            <Fragment key={group.label}>
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  sx={{ backgroundColor: 'grey.100', fontWeight: 600, color: 'text.secondary' }}
                >
                  {group.label}
                </TableCell>
              </TableRow>
              {group.rows.map((row, index) => (
                <TableRow key={`${group.label}-${index}`}>
                  <TableCell>{row.label}</TableCell>
                  {showPricePerUnit && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {row.pricePerUnit ?? MISSING_PRICE}
                    </TableCell>
                  )}
                  {showPricePerSquareMeter && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {row.pricePerSquareMeter ?? MISSING_PRICE}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
