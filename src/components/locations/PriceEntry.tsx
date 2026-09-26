import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import type { IFieldArrayEntryProps } from '@/components/form';

import { useSourceExclusion } from './sourceExclusionContext';
import type { IPriceEntryValue } from './types';

export const PriceEntry = ({ value, onChange, error }: IFieldArrayEntryProps<IPriceEntryValue>) => {
  const { options, selectedSources } = useSourceExclusion();

  const available = options.filter(name => name === value.source || !selectedSources.includes(name));
  const optionNames = value.source && !available.includes(value.source) ? [...available, value.source] : available;

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1}>
        <TextField
          select
          label="Източник"
          value={value.source}
          onChange={event => onChange({ ...value, source: event.target.value })}
          error={Boolean(error)}
          fullWidth
        >
          {optionNames.map(name => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Цена"
          type="number"
          value={value.price}
          onChange={event => onChange({ ...value, price: event.target.value })}
          error={Boolean(error)}
          fullWidth
          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
        />
      </Stack>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Stack>
  );
};
