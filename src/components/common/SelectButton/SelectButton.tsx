import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';

import { ListBox } from '@/components/common/ListBox';

import type { ISelectButtonProps } from './types';
import { defaultGetLabel, useSelectButton } from './useSelectButton';

export const SelectButton = <T,>({
  items,
  initialLabel,
  getLabel = defaultGetLabel,
  getKey,
  setSelected,
  onSet,
  onReset,
  maxHeight = 240,
  disabled,
  ref,
}: ISelectButtonProps<T>) => {
  const { anchorEl, selected, label, openMenu, closeMenu, handleSelect } = useSelectButton<T>({
    items,
    initialLabel,
    getLabel,
    setSelected,
    onSet,
    onReset,
    ref,
  });

  return (
    <>
      <Button
        variant="outlined"
        onClick={openMenu}
        disabled={disabled}
        endIcon={<ArrowDropDownIcon />}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchorEl)}
      >
        {label}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { style: { minWidth: anchorEl?.clientWidth } } }}
      >
        <ListBox
          items={items}
          getLabel={getLabel}
          getKey={getKey}
          selectedItem={selected ?? undefined}
          onItemClick={handleSelect}
          maxHeight={maxHeight}
          variant="elevation"
          elevation={0}
          square
        />
      </Popover>
    </>
  );
};
