import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ISelectButtonHandle } from '../SelectButton/types';

import { SearchableSelectButton } from './index';

interface IUser {
  id: number;
  name: string;
}

const users: IUser[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
  { id: 3, name: 'Grace Hopper' },
];

const getName = (user: IUser) => user.name;
const getId = (user: IUser) => user.id;

describe('SearchableSelectButton', () => {
  it('opens with a search field and all items when no minimum is set', async () => {
    render(<SearchableSelectButton items={users} initialLabel="Select a user" getLabel={getName} getKey={getId} />);

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grace Hopper' })).toBeInTheDocument();
  });

  it('filters items by case-insensitive substring', async () => {
    render(<SearchableSelectButton items={users} initialLabel="Select a user" getLabel={getName} getKey={getId} />);

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));
    await userEvent.type(screen.getByRole('textbox'), 'ALAN');

    expect(screen.getByRole('button', { name: 'Alan Turing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grace Hopper' })).not.toBeInTheDocument();
  });

  it('shows no items until the minimum search length is reached', async () => {
    render(
      <SearchableSelectButton
        items={users}
        initialLabel="Select a user"
        getLabel={getName}
        getKey={getId}
        minSearchLength={2}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));

    expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
    expect(screen.getByText(/Започнете да пишете/)).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox'), 'gr');

    expect(screen.getByRole('button', { name: 'Grace Hopper' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).not.toBeInTheDocument();
  });

  it('selects an item, sets the label, and reports it', async () => {
    const setSelected = vi.fn();
    const onSet = vi.fn();

    render(
      <SearchableSelectButton
        items={users}
        initialLabel="Select a user"
        getLabel={getName}
        getKey={getId}
        setSelected={setSelected}
        onSet={onSet}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));
    await userEvent.type(screen.getByRole('textbox'), 'grace');
    await userEvent.click(screen.getByRole('button', { name: 'Grace Hopper' }));

    expect(screen.getByRole('button', { name: /Grace Hopper/ })).toBeInTheDocument();
    expect(setSelected).toHaveBeenCalledWith({ id: 3, name: 'Grace Hopper' });
    expect(onSet).toHaveBeenCalledWith({ id: 3, name: 'Grace Hopper' });
  });

  it('exposes the full item list and reset through the ref', async () => {
    const ref = createRef<ISelectButtonHandle<IUser>>();

    render(
      <SearchableSelectButton ref={ref} items={users} initialLabel="Select a user" getLabel={getName} getKey={getId} />
    );

    await userEvent.click(screen.getByRole('button', { name: /Select a user/ }));
    await userEvent.type(screen.getByRole('textbox'), 'ada');

    expect(ref.current?.getItems()).toEqual(users);

    await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    expect(ref.current?.getValue()).toEqual({ id: 1, name: 'Ada Lovelace' });

    act(() => ref.current?.reset());

    expect(screen.getByRole('button', { name: /Select a user/ })).toBeInTheDocument();
    expect(ref.current?.getValue()).toBeNull();
  });

  it('disables the trigger and cannot be opened', () => {
    render(
      <SearchableSelectButton items={users} initialLabel="Select a user" getLabel={getName} getKey={getId} disabled />
    );

    expect(screen.getByRole('button', { name: /Select a user/ })).toBeDisabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
