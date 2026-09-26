import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ListBox } from '@/components/common/ListBox';

interface IUser {
  id: number;
  name: string;
}

const users: IUser[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
];

describe('ListBox', () => {
  it('renders each item using its derived label', () => {
    render(<ListBox items={users} getLabel={user => user.name} getKey={user => user.id} onItemClick={vi.fn()} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Alan Turing')).toBeInTheDocument();
  });

  it('returns the clicked item object', async () => {
    const onItemClick = vi.fn();
    render(<ListBox items={users} getLabel={user => user.name} getKey={user => user.id} onItemClick={onItemClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Alan Turing' }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith({ id: 2, name: 'Alan Turing' });
  });

  it('falls back to String(item) for primitive items', () => {
    render(<ListBox items={['one', 'two']} onItemClick={vi.fn()} />);

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });

  it('shows the empty label when there are no items', () => {
    render(<ListBox items={[]} onItemClick={vi.fn()} emptyLabel="Nothing here" />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('marks the selected item', () => {
    render(
      <ListBox
        items={users}
        getLabel={user => user.name}
        getKey={user => user.id}
        selectedItem={users[1]}
        onItemClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Alan Turing' })).toHaveClass('Mui-selected');
  });
});
