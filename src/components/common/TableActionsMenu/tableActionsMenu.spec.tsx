import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TableActionsMenu } from './TableActionsMenu';
import type { ITableActionItem } from './types';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), query: {} }),
  default: { push: vi.fn() },
}));

describe('TableActionsMenu', () => {
  it('renders nothing when there are no actions', () => {
    const { container } = render(<TableActionsMenu actions={[]} ariaLabel="Действия за ред" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the actions hidden until the trigger is clicked', async () => {
    const user = userEvent.setup();
    const actions: ITableActionItem[] = [{ key: 'edit', label: 'Промени', href: '/edit', ariaLabel: 'Промени ред' }];

    render(<TableActionsMenu actions={actions} ariaLabel="Действия за ред" />);

    expect(screen.queryByRole('menuitem', { name: 'Промени ред' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Действия за ред' }));

    expect(await screen.findByRole('menuitem', { name: 'Промени ред' })).toHaveAttribute('href', '/edit');
  });

  it('runs the action handler and closes the menu on selection', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const actions: ITableActionItem[] = [
      { key: 'delete', label: 'Изтрий', color: 'error', ariaLabel: 'Изтрий ред', onClick },
    ];

    render(<TableActionsMenu actions={actions} ariaLabel="Действия за ред" />);

    await user.click(screen.getByRole('button', { name: 'Действия за ред' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Изтрий ред' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Изтрий ред' })).not.toBeInTheDocument());
  });

  it('marks an action as disabled when requested', async () => {
    const user = userEvent.setup();
    const actions: ITableActionItem[] = [
      { key: 'delete', label: 'Изтрий', disabled: true, ariaLabel: 'Изтрий ред', onClick: vi.fn() },
    ];

    render(<TableActionsMenu actions={actions} ariaLabel="Действия за ред" />);

    await user.click(screen.getByRole('button', { name: 'Действия за ред' }));

    expect(await screen.findByRole('menuitem', { name: 'Изтрий ред' })).toHaveAttribute('aria-disabled', 'true');
  });
});
