import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useImperativeHandle, useMemo, useState } from 'react';

import type { IFieldArrayProps } from './types';

export const FieldArray = <T,>({
  value,
  onChange,
  component: EntryComponent,
  createEntry,
  entrySchema,
  validateOn = 'submit',
  minEntries = 0,
  maxEntries = Number.POSITIVE_INFINITY,
  addAriaLabel = 'Add entry',
  removeAriaLabel = 'Remove entry',
  spacing = 2,
  className,
  ref,
}: IFieldArrayProps<T>) => {
  const [showErrors, setShowErrors] = useState(validateOn === 'change');

  const errors = useMemo(() => {
    if (!entrySchema) {
      return [];
    }

    return value.map(item => {
      const result = entrySchema.safeParse(item);

      return result.success ? undefined : result.error.issues[0]?.message;
    });
  }, [entrySchema, value]);

  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        setShowErrors(true);

        return errors.every(message => !message);
      },
    }),
    [errors]
  );

  const canAdd = value.length < maxEntries;
  const canRemove = value.length > minEntries;

  const handleEntryChange = (index: number, next: T) => {
    onChange(value.map((item, position) => (position === index ? next : item)));
  };

  const handleRemove = (index: number) => {
    if (!canRemove) {
      return;
    }

    onChange(value.filter((_, position) => position !== index));
  };

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }

    onChange([...value, createEntry()]);
  };

  return (
    <Stack spacing={spacing} className={className}>
      {value.length > 0 && (
        <Stack spacing={spacing} divider={<Divider flexItem />}>
          {value.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="stretch">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EntryComponent
                  value={item}
                  onChange={next => handleEntryChange(index, next)}
                  index={index}
                  error={showErrors ? errors[index] : undefined}
                />
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  type="button"
                  aria-label={`${removeAriaLabel} ${index + 1}`}
                  onClick={() => handleRemove(index)}
                  disabled={!canRemove}
                  sx={{
                    bgcolor: 'error.main',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'error.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}

      <Divider />

      <Box sx={{ display: 'flex' }}>
        <IconButton
          type="button"
          aria-label={addAriaLabel}
          onClick={handleAdd}
          disabled={!canAdd}
          sx={{
            bgcolor: 'success.main',
            color: 'common.white',
            '&:hover': { bgcolor: 'success.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Stack>
  );
};
