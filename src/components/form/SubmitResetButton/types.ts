import type { ButtonProps } from '@mui/material/Button';

export interface ISubmitResetButtonProps extends ButtonProps {
  onReset: () => void;
  resetAriaLabel?: string;
}
