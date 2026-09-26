import Box from '@mui/material/Box';

import type { IFormRowProps } from './types';

export const FormRow = ({ children, sx }: IFormRowProps) => (
  <Box sx={[{ gridColumn: '1 / -1' }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>
);
