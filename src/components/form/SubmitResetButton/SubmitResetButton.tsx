import CloseIcon from '@mui/icons-material/Close';
import MuiButton from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import type { ISubmitResetButtonProps } from './types';

const ACTION_HEIGHT = 40;

export const SubmitResetButton = ({
  onReset,
  resetAriaLabel = 'Reset',
  type = 'submit',
  variant = 'contained',
  disabled,
  children,
  sx,
  ...primaryProps
}: ISubmitResetButtonProps) => (
  <Stack direction="row" spacing={0} alignItems="stretch" sx={{ height: ACTION_HEIGHT, width: '100%' }}>
    <MuiButton
      type={type}
      variant={variant}
      disabled={disabled}
      {...primaryProps}
      sx={[
        {
          flexGrow: 1,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: '#fff',
          color: 'error.main',
          border: '1px solid',
          borderColor: 'error.main',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#fff',
            borderColor: 'error.main',
            color: 'error.main',
            boxShadow: 'none',
          },
          '&:focus-visible': {
            backgroundColor: '#fff',
            borderColor: 'error.main',
            color: 'error.main',
          },
          '&.Mui-disabled': {
            backgroundColor: '#fff',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            color: 'rgba(0, 0, 0, 0.26)',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </MuiButton>
    <MuiButton
      type="button"
      variant="contained"
      color="error"
      aria-label={resetAriaLabel}
      onClick={onReset}
      sx={{
        minWidth: 0,
        p: 0,
        aspectRatio: '1 / 1',
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        border: '1px solid',
        borderColor: 'error.main',
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: 'error.dark',
          boxShadow: 'none',
        },
      }}
    >
      <CloseIcon />
    </MuiButton>
  </Stack>
);
