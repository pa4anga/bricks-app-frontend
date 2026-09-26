import type { TextFieldProps } from '@mui/material/TextField';

export type ITextBoxProps = Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'error'> & {
  name: string;
};
