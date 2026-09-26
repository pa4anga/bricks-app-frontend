import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import type { Location } from '@/api/model';
import { LocationsTable } from '@/components/locations';
import { INTERNAL_LOCATION_EDIT_ROUTE } from '@/constants/routes';
import { server } from '@/mocks/server';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), query: {} }),
  default: { push: vi.fn() },
}));

const locations: Location[] = [
  {
    _id: 'l1',
    name: 'Бургас',
    municipality: 'Бургас',
    postcode: 8000,
    salesWbRegion: 'WB1',
    sapRegion: 'SAP1',
    prices: [
      { source: 'София', price: 10 },
      { source: 'Варна', price: 20 },
    ],
  },
  {
    _id: 'l2',
    name: 'Русе',
    municipality: 'Русе',
    postcode: 7000,
    prices: [{ source: 'София', price: 15 }],
  },
];

const renderTable = (rows: Location[] = locations, onDeleted = vi.fn()) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <LocationsTable locations={rows} page={1} pageCount={1} onPageChange={vi.fn()} onDeleted={onDeleted} />
    </SWRConfig>
  );

describe('LocationsTable', () => {
  it('renders a column for each unique price source', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'София' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Варна' })).toBeInTheDocument();
  });

  it('fills price cells and uses a dash where a source is missing', () => {
    renderTable();

    const burgasRow = screen.getByRole('row', { name: /Бургас/ });
    expect(within(burgasRow).getByText('10')).toBeInTheDocument();
    expect(within(burgasRow).getByText('20')).toBeInTheDocument();

    const ruseRow = screen.getByRole('row', { name: /Русе/ });
    expect(within(ruseRow).getByText('15')).toBeInTheDocument();
    expect(within(ruseRow).getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('links each row to its edit page by id', async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole('button', { name: 'Действия за Бургас' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Бургас' })).toHaveAttribute(
      'href',
      INTERNAL_LOCATION_EDIT_ROUTE('l1')
    );

    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Действия за Русе' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Русе' })).toHaveAttribute(
      'href',
      INTERNAL_LOCATION_EDIT_ROUTE('l2')
    );
  });

  it('deletes a location and notifies the parent', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    let deleted = false;
    server.use(
      http.delete('*/locations/l1', () => {
        deleted = true;

        return HttpResponse.json({ id: 'l1' }, { status: 200 });
      })
    );

    renderTable(locations, onDeleted);
    await user.click(screen.getByRole('button', { name: 'Действия за Бургас' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Изтрий Бургас' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(deleted).toBe(true);
  });

  it('shows an error when deletion fails', async () => {
    const user = userEvent.setup();
    server.use(http.delete('*/locations/l1', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));

    renderTable();
    await user.click(screen.getByRole('button', { name: 'Действия за Бургас' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Изтрий Бургас' }));

    expect(await screen.findByText('Неуспешно изтриване на локацията.')).toBeInTheDocument();
  });
});
