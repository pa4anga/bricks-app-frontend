import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ISelectButtonHandle } from './types';

import { SelectButton } from './index';

interface IUser {
  id: number;
  name: string;
}

const users: IUser[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
];

describe('SelectButton', () => {
  it('shows the initial label and opens the dropdown on click', async () => {
    render(
      <SelectButton items={users} initialLabel="Select a user" getLabel={user => user.name} getKey={user => user.id} />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));

    expect(screen.getByRole('button', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alan Turing' })).toBeInTheDocument();
  });

  it('sets the button label and reports the object when an item is picked', async () => {
    const setSelected = vi.fn();
    const onSet = vi.fn();

    render(
      <SelectButton
        items={users}
        initialLabel="Select a user"
        getLabel={user => user.name}
        getKey={user => user.id}
        setSelected={setSelected}
        onSet={onSet}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Alan Turing' }));

    expect(screen.getByRole('button', { name: /Alan Turing/ })).toBeInTheDocument();
    expect(setSelected).toHaveBeenCalledWith({ id: 2, name: 'Alan Turing' });
    expect(onSet).toHaveBeenCalledWith({ id: 2, name: 'Alan Turing' });
    expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
  });

  it('exposes getValue and getItems through the ref', async () => {
    const ref = createRef<ISelectButtonHandle<IUser>>();

    render(
      <SelectButton
        ref={ref}
        items={users}
        initialLabel="Select"
        getLabel={user => user.name}
        getKey={user => user.id}
      />
    );

    expect(ref.current?.getItems()).toEqual(users);
    expect(ref.current?.getValue()).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Select/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

    expect(ref.current?.getValue()).toEqual({ id: 1, name: 'Ada Lovelace' });
  });

  it('resets the label and selection through the ref and fires onReset', async () => {
    const setSelected = vi.fn();
    const onReset = vi.fn();
    const ref = createRef<ISelectButtonHandle<IUser>>();

    render(
      <SelectButton
        ref={ref}
        items={users}
        initialLabel="Select"
        getLabel={user => user.name}
        getKey={user => user.id}
        setSelected={setSelected}
        onReset={onReset}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument();

    act(() => ref.current?.reset());

    expect(screen.getByRole('button', { name: /Select/ })).toBeInTheDocument();
    expect(ref.current?.getValue()).toBeNull();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(setSelected).toHaveBeenLastCalledWith(null);
  });

  it('reflects items updated after the initial render', async () => {
    const ref = createRef<ISelectButtonHandle<IUser>>();
    const props = {
      ref,
      initialLabel: 'Select',
      getLabel: (user: IUser) => user.name,
      getKey: (user: IUser) => user.id,
    };

    const { rerender } = render(<SelectButton items={users} {...props} />);

    const moreUsers = [...users, { id: 3, name: 'Grace Hopper' }];
    rerender(<SelectButton items={moreUsers} {...props} />);

    expect(ref.current?.getItems()).toEqual(moreUsers);

    await userEvent.click(screen.getByRole('button', { name: /Select/ }));
    expect(screen.getByRole('button', { name: 'Grace Hopper' })).toBeInTheDocument();
  });

  it('disables the trigger and cannot be opened', () => {
    render(
      <SelectButton
        items={users}
        initialLabel="Select a user"
        getLabel={user => user.name}
        getKey={user => user.id}
        disabled
      />
    );

    expect(screen.getByRole('button', { name: /Select a user/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
  });
});
