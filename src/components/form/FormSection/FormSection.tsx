import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { IFormSectionProps } from './types';

export const FormSection = ({ title, columns = 1, children, sx }: IFormSectionProps) => (
  <Box component="section" sx={sx}>
    {title && (
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{
          mb: 2,
          pb: 1,
          fontWeight: 600,
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {title}
      </Typography>
    )}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: columns === 2 ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr',
        columnGap: 2,
        rowGap: 2,
        alignItems: 'start',
      }}
    >
      {children}
    </Box>
  </Box>
);
