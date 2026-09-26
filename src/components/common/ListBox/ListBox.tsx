import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { IListBoxProps } from './types';

const defaultGetLabel = (item: unknown): string => String(item);
const defaultGetKey = (_item: unknown, index: number): number => index;
const defaultIsItemSelected = (item: unknown, selectedItem: unknown): boolean => item === selectedItem;

export const ListBox = <T,>({
  items,
  onItemClick,
  getLabel = defaultGetLabel,
  getKey = defaultGetKey,
  selectedItem,
  isItemSelected = defaultIsItemSelected,
  disableItem,
  emptyLabel = 'No items',
  maxHeight = 240,
  sx,
  ...paperProps
}: IListBoxProps<T>) => (
  <Paper
    variant="outlined"
    {...paperProps}
    sx={[
      {
        maxHeight,
        overflowY: 'scroll',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {items.length === 0 ? (
      <Typography component="p" color="text.secondary" sx={{ p: 2 }}>
        {emptyLabel}
      </Typography>
    ) : (
      <List disablePadding>
        {items.map((item, index) => (
          <ListItem key={getKey(item, index)} disablePadding>
            <ListItemButton
              selected={selectedItem !== undefined && isItemSelected(item, selectedItem)}
              disabled={disableItem?.(item) ?? false}
              onClick={() => onItemClick(item)}
            >
              <ListItemText primary={getLabel(item)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);
