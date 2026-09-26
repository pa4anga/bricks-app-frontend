import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LocationInput } from '@/api/model';
import { LocationForm } from '@/components/locations';
import type { ILocationFormValues } from '@/components/locations';
import { server } from '@/mocks/server';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const sourceLocations = [
  { _id: 's1', name: 'София' },
  { _id: 's2', name: 'Пловдив' },
  { _id: 's3', name: 'Варна' },
];

interface IRenderOptions {
  submit?: ReturnType<typeof vi.fn>;
  nameDisabled?: boolean;
  initialValues?: ILocationFormValues;
}

const renderForm = (options: IRenderOptions = {}) => {
  const submit = options.submit ?? vi.fn().mockResolvedValue({});
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <LocationForm
        submitLabel="Създай локация"
        submitErrorMessage="Неуспешно създаване на локация. Опитайте отново."
        submitting={false}
        submit={submit}
        nameDisabled={options.nameDisabled}
        initialValues={options.initialValues}
      />
    </SWRConfig>
  );

  return { submit };
};

const addPriceRow = async (user: ReturnType<typeof userEvent.setup>) => {
  const addButton = await screen.findByRole('button', { name: 'Добави цена' });
  await waitFor(() => expect(addButton).toBeEnabled());
  await user.click(addButton);
};

describe('LocationForm', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(http.get('*/source-locations', () => HttpResponse.json(sourceLocations, { status: 200 })));
  });

  it('renders every scalar field', async () => {
    renderForm();

    expect(await screen.findByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Географска ширина')).toBeInTheDocument();
    expect(screen.getByLabelText('Географска дължина')).toBeInTheDocument();
    expect(screen.getByLabelText('Пощенски код')).toBeInTheDocument();
    expect(screen.getByLabelText('Община')).toBeInTheDocument();
    expect(screen.getByLabelText('SAP регион')).toBeInTheDocument();
    expect(screen.getByLabelText('Търговски регион')).toBeInTheDocument();
  });

  it('removes a chosen source from other rows and keeps the exclusion in sync', async () => {
    const user = userEvent.setup();
    renderForm();
    await screen.findByLabelText('Име');

    await addPriceRow(user);
    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: 'София' }));

    await addPriceRow(user);
    await user.click(screen.getAllByRole('combobox')[1]);

    expect(screen.queryByRole('option', { name: 'София' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Пловдив' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Варна' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Пловдив' }));

    await user.click(screen.getAllByRole('combobox')[0]);
    expect(screen.getByRole('option', { name: 'София' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Пловдив' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Варна' })).toBeInTheDocument();
  });

  it('builds the location payload and redirects on submit', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    renderForm({ submit });
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Бургас' } });
    fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: '42.5' } });
    fireEvent.change(screen.getByLabelText('Географска дължина'), { target: { value: '27.47' } });
    fireEvent.change(screen.getByLabelText('Пощенски код'), { target: { value: '8000' } });
    fireEvent.change(screen.getByLabelText('Община'), { target: { value: 'Бургас' } });
    fireEvent.change(screen.getByLabelText('SAP регион'), { target: { value: 'SAP1' } });
    fireEvent.change(screen.getByLabelText('Търговски регион'), { target: { value: 'WB1' } });

    await addPriceRow(user);
    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await screen.findByRole('option', { name: 'Пловдив' }));
    fireEvent.change(screen.getByLabelText('Цена'), { target: { value: '12.5' } });

    await user.click(screen.getByRole('button', { name: 'Създай локация' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const payload = submit.mock.calls[0][0] as LocationInput;
    expect(payload).toEqual({
      name: 'Бургас',
      coordinates: { type: 'Point', coordinates: [27.47, 42.5] },
      postcode: 8000,
      municipality: 'Бургас',
      sapRegion: 'SAP1',
      salesWbRegion: 'WB1',
      prices: [{ source: 'Пловдив', price: 12.5 }],
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/locations'));
  });

  it('shows a duplicate-name error when the API responds with 409', async () => {
    const user = userEvent.setup();
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { field: 'name', message: 'taken' } },
    });
    const submit = vi.fn().mockRejectedValue(conflict);
    renderForm({ submit });
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'София' } });
    fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('Географска дължина'), { target: { value: '23' } });

    await user.click(screen.getByRole('button', { name: 'Създай локация' }));

    expect(await screen.findByText('Локация с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('blocks submission when a coordinate is out of range', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm({ submit });
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Бургас' } });
    fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText('Географска дължина'), { target: { value: '27' } });

    await user.click(screen.getByRole('button', { name: 'Създай локация' }));

    expect(await screen.findByText('Географската ширина трябва да е число между -90 и 90.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('flags an incomplete price row on submit', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm({ submit });
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Бургас' } });
    fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('Географска дължина'), { target: { value: '27' } });

    await addPriceRow(user);
    await user.click(screen.getByRole('button', { name: 'Създай локация' }));

    expect(await screen.findByText('Изберете източник.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('disables the name field when nameDisabled is set', async () => {
    renderForm({
      nameDisabled: true,
      initialValues: {
        name: 'Бургас',
        latitude: '42.5',
        longitude: '27.47',
        postcode: '8000',
        municipality: 'Бургас',
        sapRegion: 'SAP1',
        salesWbRegion: 'WB1',
        prices: [],
      },
    });

    const nameField = await screen.findByLabelText('Име');
    expect(nameField).toBeDisabled();
    expect(nameField).toHaveValue('Бургас');
  });
});
