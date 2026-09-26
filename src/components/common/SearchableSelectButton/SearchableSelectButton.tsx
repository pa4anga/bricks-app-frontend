import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import { useEffect, useMemo, useState } from 'react';

import { ListBox } from '@/components/common/ListBox';

import { defaultGetLabel, useSelectButton } from '../SelectButton/useSelectButton';

import type { ISearchableSelectButtonProps } from './types';

import styles from './searchableSelectButton.module.scss';

export const SearchableSelectButton = <T,>({
  items,
  initialLabel,
  getLabel = defaultGetLabel,
  getKey,
  setSelected,
  onSet,
  onReset,
  maxHeight = 240,
  minSearchLength = 0,
  searchPlaceholder = 'Search…',
  disabled,
  ref,
}: ISearchableSelectButtonProps<T>) => {
  const { anchorEl, selected, label, openMenu, closeMenu, handleSelect } = useSelectButton<T>({
    items,
    initialLabel,
    getLabel,
    setSelected,
    onSet,
    onReset,
    ref,
  });
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!anchorEl) {
      setQuery('');
    }
  }, [anchorEl]);

  const trimmedQuery = query.trim();
  const meetsThreshold = trimmedQuery.length >= minSearchLength;

  const visibleItems = useMemo(() => {
    if (!meetsThreshold) {
      return [];
    }

    const needle = trimmedQuery.toLowerCase();
    return items.filter(item => getLabel(item).toLowerCase().includes(needle));
  }, [items, getLabel, meetsThreshold, trimmedQuery]);

  const emptyLabel = meetsThreshold ? 'No matches' : `Започнете да пишете (на кирилица) и изберете от резултатите...`;

  return (
    <>
      <Button
        variant="outlined"
        onClick={openMenu}
        disabled={disabled}
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchorEl)}
        className={styles.button}
        sx={{
          minWidth: 'auto',
          borderColor: 'grey.500',
          '&:hover': {
            borderColor: 'grey.500',
          },
        }}
      >
        <Box component="span" sx={{ display: 'grid', alignItems: 'center' }}>
          <Box
            aria-hidden
            component="span"
            sx={{
              gridArea: '1 / 1',
              height: 0,
              overflow: 'hidden',
              visibility: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {initialLabel}
          </Box>
          <Box
            component="span"
            sx={{
              gridArea: '1 / 1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Box>
        </Box>
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { style: { minWidth: anchorEl?.clientWidth } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            size="small"
            autoFocus
            sx={{ p: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ListBox
            items={visibleItems}
            getLabel={getLabel}
            getKey={getKey}
            selectedItem={selected ?? undefined}
            onItemClick={handleSelect}
            maxHeight={maxHeight}
            emptyLabel={emptyLabel}
            variant="elevation"
            elevation={0}
            square
          />
        </Box>
      </Popover>
    </>
  );
};
