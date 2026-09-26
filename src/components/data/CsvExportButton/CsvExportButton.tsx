import DownloadIcon from '@mui/icons-material/Download';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useState } from 'react';

import { Button } from '@/components/form';
import { downloadTextFile } from '@/helpers';

import type { ICsvExportButtonProps } from './types';

const EXPORT_ERROR_MESSAGE = 'Възникна грешка при експортирането. Опитайте отново.';

export const CsvExportButton = ({ label, filename, fetchCsv }: ICsvExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const handleClick = async () => {
    setIsExporting(true);
    setErrorMessage(undefined);

    try {
      const csv = await fetchCsv();
      downloadTextFile(csv, filename);
    } catch {
      setErrorMessage(EXPORT_ERROR_MESSAGE);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Button
        variant="outlined"
        onClick={handleClick}
        disabled={isExporting}
        startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
      >
        {label}
      </Button>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Stack>
  );
};
