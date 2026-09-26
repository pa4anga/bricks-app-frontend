import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Fragment } from 'react';

import { cookieCategories, getCookiesByCategory } from '@/content/legal/cookieRegistry';

export const CookieUsageTable = () => (
  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
    <Table aria-label="Използвани бисквитки" size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Име</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Доставчик</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Предназначение</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Срок</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cookieCategories.map(category => (
          <Fragment key={category.id}>
            <TableRow>
              <TableCell colSpan={4} sx={{ backgroundColor: 'grey.100', fontWeight: 600, color: 'text.secondary' }}>
                {category.label}
              </TableCell>
            </TableRow>
            {getCookiesByCategory(category.id).map(cookie => (
              <TableRow key={cookie.name}>
                <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{cookie.name}</TableCell>
                <TableCell>{cookie.provider}</TableCell>
                <TableCell>{cookie.purpose}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{cookie.duration}</TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
