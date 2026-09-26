import UploadFileIcon from '@mui/icons-material/UploadFile';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ChangeEvent, CSSProperties } from 'react';

import type { IFilePickerProps } from './types';

const DEFAULT_NO_FILE_TEXT = 'Няма избран файл';

const HIDDEN_INPUT_STYLE: CSSProperties = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};

export const FilePicker = ({
  id,
  label,
  accept,
  file,
  onFileChange,
  disabled = false,
  noFileText = DEFAULT_NO_FILE_TEXT,
}: IFilePickerProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
      <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={disabled}>
        {label}
        <input
          type="file"
          id={id}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          style={HIDDEN_INPUT_STYLE}
        />
      </Button>
      <Typography variant="body2" color={file ? 'text.primary' : 'text.secondary'}>
        {file ? file.name : noFileText}
      </Typography>
    </Stack>
  );
};
