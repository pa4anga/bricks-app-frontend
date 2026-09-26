import MuiButton from '@mui/material/Button';

import type { IButtonProps } from './types';

export const Button = ({ variant = 'contained', ...rest }: IButtonProps) => <MuiButton variant={variant} {...rest} />;
