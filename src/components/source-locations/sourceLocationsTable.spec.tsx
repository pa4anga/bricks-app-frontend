import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import type { SourceLocation } from '@/api/model';
import { INTERNAL_SOURCE_LOCATION_EDIT_ROUTE } from '@/constants/routes';
import { server } from '@/mocks/server';

import { SourceLocationsTable } from './SourceLocationsTable';

const sourceLocations: SourceLocation[] = [
  { _id: '1', name: 'София', truckCapacityKg: 20000 },
  { _id: '2', name: 'Пловдив', truckCapacityKg: 15000 },
];

const renderTable = (locations: SourceLocation[], onDeleted = vi.fn()) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <SourceLocationsTable sourceLocations={locations} onDeleted={onDeleted} />
    </SWRConfig>
  );

describe('SourceLocationsTable', () => {
  it('renders every source location name and truck capacity', () => {
    renderTable(sourceLocations);

    expect(screen.getByText('София')).toBeInTheDocument();
    expect(screen.getByText('20000')).toBeInTheDocument();
    expect(screen.getByText('Пловдив')).toBeInTheDocument();
    expect(screen.getByText('15000')).toBeInTheDocument();
  });

  it('shows an actions menu for every row', () => {
    renderTable(sourceLocations);

    expect(screen.getByRole('button', { name: 'Действия за София' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия за Пловдив' })).toBeInTheDocument();
  });

  it('links each row to its edit page', async () => {
    renderTable(sourceLocations);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени София' })).toHaveAttribute(
      'href',
      INTERNAL_SOURCE_LOCATION_EDIT_ROUTE('София')
    );

    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Пловдив' }));
    expect(await screen.findByRole('menuitem', { name: 'Промени Пловдив' })).toHaveAttribute(
      'href',
      INTERNAL_SOURCE_LOCATION_EDIT_ROUTE('Пловдив')
    );
  });

  it('deletes a source location and notifies the parent', async () => {
    server.use(
      http.delete('*/source-locations/:name', ({ params }) => HttpResponse.json({ name: params.name }, { status: 200 }))
    );
    const onDeleted = vi.fn();
    renderTable(sourceLocations, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий София' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it('surfaces the in-use error and keeps the parent untouched when the API blocks deletion with a 409', async () => {
    server.use(
      http.delete('*/source-locations/:name', () => HttpResponse.json({ message: 'referenced' }, { status: 409 }))
    );
    const onDeleted = vi.fn();
    renderTable(sourceLocations, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за София' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий София' }));

    expect(
      await screen.findByText('Производствената база се използва от продукт и не може да бъде изтрита.')
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('surfaces a generic error when deletion fails for another reason', async () => {
    server.use(http.delete('*/source-locations/:name', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    const onDeleted = vi.fn();
    renderTable(sourceLocations, onDeleted);

    await userEvent.click(screen.getByRole('button', { name: 'Действия за Пловдив' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий Пловдив' }));

    expect(await screen.findByText('Неуспешно изтриване на производствената база.')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
