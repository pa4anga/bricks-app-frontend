import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResultActions } from './ResultActions';

describe('ResultActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Print and Save buttons that both open the browser print dialog', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ResultActions />);

    await userEvent.click(screen.getByRole('button', { name: /Печат/ }));
    await userEvent.click(screen.getByRole('button', { name: /Запази като PDF/ }));

    expect(printSpy).toHaveBeenCalledTimes(2);
  });

  it('renders a Системни компоненти link to the given href when provided', () => {
    render(<ResultActions systemComponentsHref="/prices/system-components?product=p1&settlement=Sofia" />);

    expect(screen.getByRole('link', { name: 'Системни компоненти' })).toHaveAttribute(
      'href',
      '/prices/system-components?product=p1&settlement=Sofia'
    );
  });

  it('omits the Системни компоненти link when no href is provided', () => {
    render(<ResultActions />);

    expect(screen.queryByRole('link', { name: 'Системни компоненти' })).not.toBeInTheDocument();
  });
});
