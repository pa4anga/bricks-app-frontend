import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { Button, FilePicker } from '@/components/form';

import type { ICsvImportFormProps, ICsvImportResult } from './types';

const CSV_ACCEPT = '.csv,text/csv';
const DEFAULT_ERROR_MESSAGE = 'Възникна грешка при импортирането. Проверете файла и опитайте отново.';

interface IParsedImportError {
  message?: string;
  errors: string[];
}

const parseImportError = (error: unknown): IParsedImportError => {
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (!data || typeof data !== 'object') {
    return { errors: [] };
  }

  const record = data as { message?: unknown; errors?: unknown };
  const message = typeof record.message === 'string' ? record.message : undefined;
  const errors = Array.isArray(record.errors)
    ? record.errors.filter((item): item is string => typeof item === 'string')
    : [];

  return { message, errors };
};

export const CsvImportForm = ({ title, inputId, pickerLabel, onImport }: ICsvImportFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ICsvImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!file) {
      return;
    }

    setIsImporting(true);
    setResult(null);
    setErrorMessage(undefined);
    setRowErrors([]);

    try {
      const imported = await onImport(file);
      setResult(imported);
      setFile(null);
    } catch (error) {
      const parsed = parseImportError(error);
      setErrorMessage(parsed.message ?? DEFAULT_ERROR_MESSAGE);
      setRowErrors(parsed.errors);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        <FilePicker
          id={inputId}
          label={pickerLabel}
          accept={CSV_ACCEPT}
          file={file}
          onFileChange={setFile}
          disabled={isImporting}
        />
        <Box>
          <Button
            onClick={handleSubmit}
            disabled={!file || isImporting}
            startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isImporting ? 'Импортиране…' : 'Импортирай'}
          </Button>
        </Box>
        {result && (
          <Alert severity="success">
            {`Готово. Създадени: ${result.created}, обновени: ${result.updated}, общо: ${result.total}.`}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error">
            <Typography variant="body2">{errorMessage}</Typography>
            {rowErrors.length > 0 && (
              <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {rowErrors.map((rowError, index) => (
                  <ListItem key={`${inputId}-error-${index}`} disableGutters sx={{ py: 0 }}>
                    <Typography variant="caption">{rowError}</Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Alert>
        )}
      </Stack>
    </Box>
  );
};
