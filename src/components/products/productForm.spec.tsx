import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Product } from '@/api/model';
import { DUPLICATE_COMPONENT_NAME_MESSAGE, ProductForm, productToFormValues } from '@/components/products';
import type { IProductKind } from '@/constants/productKinds';
import { BRICK_PRODUCT_KIND, PAVEMENT_PRODUCT_KIND } from '@/constants/productKinds';
import { server } from '@/mocks/server';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const sourceLocations = [
  { _id: 's1', name: 'София' },
  { _id: 's2', name: 'Пловдив' },
];

const feeCategories = [
  { _id: 'f1', name: 'Стандартна' },
  { _id: 'f2', name: 'Намалена' },
];

const existingProduct: Product = {
  _id: 'b1',
  name: 'Единична тухла',
  kind: 'Тухли',
  variant: 'Единична тухла',
  system: 'Единична тухла',
  subtype: 'Блок',
  rawUnitPrice: 0.85,
  countPerPallet: 96,
  minimumOrderUnits: 5,
  palletWeightKg: 1200,
  productionSource: 'Внос',
  sourceLocation: 'София',
  feeCategory: 'Стандартна',
  sapNumber: 'SAP-100',
  imageId: 'img-existing',
};

interface IRenderOptions {
  submit?: ReturnType<typeof vi.fn>;
  initialValues?: ReturnType<typeof productToFormValues>;
  existingImageId?: string;
  productKind?: IProductKind;
}

const renderForm = (options: IRenderOptions = {}) => {
  const submit = options.submit ?? vi.fn().mockResolvedValue({});
  const utils = render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <ProductForm
        productKind={options.productKind ?? BRICK_PRODUCT_KIND}
        submitLabel="Създай продукт"
        submitErrorMessage="Неуспешно създаване на продукт. Опитайте отново."
        submitting={false}
        submit={submit}
        initialValues={options.initialValues}
        existingImageId={options.existingImageId}
      />
    </SWRConfig>
  );

  return { submit, ...utils };
};

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Единична тухла' } });
  fireEvent.change(screen.getByLabelText('Тип'), { target: { value: 'Блок' } });
  fireEvent.change(screen.getByLabelText('Единична цена'), { target: { value: '0.85' } });
  fireEvent.change(screen.getByLabelText('Брой в палет'), { target: { value: '96' } });
  fireEvent.change(screen.getByLabelText('Минимално количество'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Тегло на палет (кг)'), { target: { value: '1200' } });
  fireEvent.change(screen.getByLabelText('SAP номер'), { target: { value: 'SAP-100' } });

  await user.click(screen.getByRole('combobox', { name: 'Произход' }));
  await user.click(await screen.findByRole('option', { name: 'Внос' }));
  await user.click(screen.getByRole('combobox', { name: 'Производствена база' }));
  await user.click(await screen.findByRole('option', { name: 'София' }));
  await user.click(screen.getByRole('combobox', { name: 'Категория надценка' }));
  await user.click(await screen.findByRole('option', { name: 'Стандартна' }));
};

const uploadImage = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, new File(['x'], 'brick.png', { type: 'image/png' }));
};

describe('ProductForm', () => {
  beforeEach(() => {
    push.mockClear();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    server.use(
      http.get('*/source-locations', () => HttpResponse.json(sourceLocations, { status: 200 })),
      http.get('*/fee-categories', () => HttpResponse.json(feeCategories, { status: 200 }))
    );
  });

  it('renders the brick fields without system, variant, or units per square meter', async () => {
    renderForm();

    expect(await screen.findByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Тип')).toBeInTheDocument();
    expect(screen.getByLabelText('Единична цена')).toBeInTheDocument();
    expect(screen.getByLabelText('Брой в палет')).toBeInTheDocument();
    expect(screen.getByLabelText('Минимално количество')).toBeInTheDocument();
    expect(screen.getByLabelText('Тегло на палет (кг)')).toBeInTheDocument();
    expect(screen.getByLabelText('SAP номер')).toBeInTheDocument();
    expect(screen.getByLabelText('Размер')).toBeInTheDocument();
    expect(screen.getByLabelText('Клас на доставка')).toBeInTheDocument();
    expect(screen.getByLabelText('Коментар')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(4);

    expect(screen.queryByLabelText('Система')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Вариант')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Брой на м²')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Икона (Натоварване)')).not.toBeInTheDocument();
  });

  it('blocks submission and reports errors when required fields are empty', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm({ submit });
    await screen.findByLabelText('Име');

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect(await screen.findByText('Въведете име')).toBeInTheDocument();
    expect(screen.getByText('Изберете произход.')).toBeInTheDocument();
    expect(screen.getByText('Изберете изображение.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('builds the brick payload with name-derived variant and system and redirects on submit', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    const { container } = renderForm({ submit });
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    await uploadImage(user, container);

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toEqual({
      name: 'Единична тухла',
      kind: 'Тухли',
      variant: 'Единична тухла',
      system: 'Единична тухла',
      subtype: 'Блок',
      priceUnit: 'бр.',
      rawUnitPrice: 0.85,
      countPerPallet: 96,
      minimumOrderUnits: 5,
      palletWeightKg: 1200,
      productionSource: 'Внос',
      sourceLocation: 'София',
      feeCategory: 'Стандартна',
      sapNumber: 'SAP-100',
      imageId: 'img1',
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/products/bricks'));
  });

  it('builds an m² payload with pricePerSquareMeter and no rawUnitPrice when the м² unit is selected', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    const { container } = renderForm({ submit });
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Единична тухла' } });
    fireEvent.change(screen.getByLabelText('Тип'), { target: { value: 'Блок' } });

    await user.click(screen.getByRole('combobox', { name: 'Мерна единица за цена' }));
    await user.click(await screen.findByRole('option', { name: 'м²' }));

    fireEvent.change(screen.getByLabelText('Цена на м²'), { target: { value: '42.5' } });
    fireEvent.change(screen.getByLabelText('Брой в палет'), { target: { value: '96' } });
    fireEvent.change(screen.getByLabelText('Минимално количество'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Тегло на палет (кг)'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('SAP номер'), { target: { value: 'SAP-100' } });

    await user.click(screen.getByRole('combobox', { name: 'Произход' }));
    await user.click(await screen.findByRole('option', { name: 'Внос' }));
    await user.click(screen.getByRole('combobox', { name: 'Производствена база' }));
    await user.click(await screen.findByRole('option', { name: 'София' }));
    await user.click(screen.getByRole('combobox', { name: 'Категория надценка' }));
    await user.click(await screen.findByRole('option', { name: 'Стандартна' }));

    await uploadImage(user, container);
    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const payload = submit.mock.calls[0][0];
    expect(payload.priceUnit).toBe('m2');
    expect(payload.pricePerSquareMeter).toBe(42.5);
    expect(payload).not.toHaveProperty('rawUnitPrice');
    expect(screen.queryByLabelText('Единична цена')).not.toBeInTheDocument();
  });

  it('preserves each price value across priceUnit toggles and drops the redundant field only on submit', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    const { container } = renderForm({ submit });
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Име'), { target: { value: 'Единична тухла' } });
    fireEvent.change(screen.getByLabelText('Тип'), { target: { value: 'Блок' } });

    fireEvent.change(screen.getByLabelText('Единична цена'), { target: { value: '0.85' } });

    await user.click(screen.getByRole('combobox', { name: 'Мерна единица за цена' }));
    await user.click(await screen.findByRole('option', { name: 'м²' }));
    expect(screen.queryByLabelText('Единична цена')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Цена на м²'), { target: { value: '42.5' } });

    await user.click(screen.getByRole('combobox', { name: 'Мерна единица за цена' }));
    await user.click(await screen.findByRole('option', { name: 'бр.' }));
    expect(screen.queryByLabelText('Цена на м²')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Единична цена')).toHaveValue(0.85);

    await user.click(screen.getByRole('combobox', { name: 'Мерна единица за цена' }));
    await user.click(await screen.findByRole('option', { name: 'м²' }));
    expect(screen.getByLabelText('Цена на м²')).toHaveValue(42.5);

    await user.click(screen.getByRole('combobox', { name: 'Мерна единица за цена' }));
    await user.click(await screen.findByRole('option', { name: 'бр.' }));

    fireEvent.change(screen.getByLabelText('Брой в палет'), { target: { value: '96' } });
    fireEvent.change(screen.getByLabelText('Минимално количество'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Тегло на палет (кг)'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('SAP номер'), { target: { value: 'SAP-100' } });

    await user.click(screen.getByRole('combobox', { name: 'Произход' }));
    await user.click(await screen.findByRole('option', { name: 'Внос' }));
    await user.click(screen.getByRole('combobox', { name: 'Производствена база' }));
    await user.click(await screen.findByRole('option', { name: 'София' }));
    await user.click(screen.getByRole('combobox', { name: 'Категория надценка' }));
    await user.click(await screen.findByRole('option', { name: 'Стандартна' }));

    await uploadImage(user, container);
    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const payload = submit.mock.calls[0][0];
    expect(payload.priceUnit).toBe('бр.');
    expect(payload.rawUnitPrice).toBe(0.85);
    expect(payload).not.toHaveProperty('pricePerSquareMeter');
  });

  it('highlights the name field when the API reports a duplicate name (409)', async () => {
    const user = userEvent.setup();
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { field: 'name', message: 'taken' } },
    });
    const submit = vi.fn().mockRejectedValue(conflict);
    const { container } = renderForm({ submit });
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    await uploadImage(user, container);

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect(await screen.findByText('Продукт с това име вече съществува.')).toBeInTheDocument();
    expect(screen.queryByText('Продукт с този SAP номер вече съществува.')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('highlights the SAP number field when the API reports a duplicate sapNumber (409)', async () => {
    const user = userEvent.setup();
    const conflict = Object.assign(new Error('conflict'), {
      isAxiosError: true,
      response: { status: 409, data: { field: 'sapNumber', message: 'taken' } },
    });
    const submit = vi.fn().mockRejectedValue(conflict);
    const { container } = renderForm({ submit });
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    await uploadImage(user, container);

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect(await screen.findByText('Продукт с този SAP номер вече съществува.')).toBeInTheDocument();
    expect(screen.queryByText('Продукт с това име вече съществува.')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('prefills the fields from initial values', async () => {
    renderForm({ initialValues: productToFormValues(existingProduct) });

    expect(await screen.findByLabelText('Име')).toHaveValue('Единична тухла');
    expect(screen.getByLabelText('Тип')).toHaveValue('Блок');
    expect(screen.getByLabelText('Брой в палет')).toHaveValue(96);
    expect(screen.getByLabelText('SAP номер')).toHaveValue('SAP-100');
  });

  it('reuses the existing image without re-uploading it when the image is unchanged', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    let imageUploads = 0;
    server.use(
      http.post('*/images', () => {
        imageUploads += 1;

        return HttpResponse.json({ id: 'img-new' }, { status: 201 });
      })
    );
    renderForm({ submit, initialValues: productToFormValues(existingProduct), existingImageId: 'img-existing' });
    await screen.findByLabelText('Име');

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].imageId).toBe('img-existing');
    expect(imageUploads).toBe(0);
  });

  it('uploads a new image and sends the new id when the image is changed', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img-new' }, { status: 201 })));
    const { container } = renderForm({
      submit,
      initialValues: productToFormValues(existingProduct),
      existingImageId: 'img-existing',
    });
    await screen.findByLabelText('Име');

    await uploadImage(user, container);
    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].imageId).toBe('img-new');
  });

  it('renders the iconLoad field for pavements', async () => {
    renderForm({ productKind: PAVEMENT_PRODUCT_KIND });

    expect(await screen.findByLabelText('Икона (Натоварване)')).toBeInTheDocument();
    expect(screen.getByLabelText('Вариант')).toBeInTheDocument();
    expect(screen.getByLabelText('Система')).toBeInTheDocument();
  });

  it('sends iconLoad in the payload for pavements', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    const { container } = renderForm({ submit, productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    fireEvent.change(screen.getByLabelText('Вариант'), { target: { value: 'Сив' } });
    fireEvent.change(screen.getByLabelText('Система'), { target: { value: 'Оптима' } });
    fireEvent.change(screen.getByLabelText('Икона (Натоварване)'), { target: { value: '3.5t' } });
    await uploadImage(user, container);

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].kind).toBe('Настилки');
    expect(submit.mock.calls[0][0].iconLoad).toBe('3.5t');
  });

  it('hides the system components section for bricks', async () => {
    renderForm();
    await screen.findByLabelText('Име');

    expect(screen.queryByText('Системни компоненти')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Добави компонент' })).not.toBeInTheDocument();
  });

  it('adds and removes system component entries for pavements', async () => {
    const user = userEvent.setup();
    renderForm({ productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    expect(screen.getByText('Системни компоненти')).toBeInTheDocument();
    expect(screen.queryByLabelText('Вид')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    expect(screen.getAllByLabelText('Вид')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    expect(screen.getAllByLabelText('Вид')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Премахни компонент 1' }));
    expect(screen.getAllByLabelText('Вид')).toHaveLength(1);
  });

  it('blocks submission when a system component is incomplete', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const { container } = renderForm({ submit, productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    fireEvent.change(screen.getByLabelText('Вариант'), { target: { value: 'Сив' } });
    fireEvent.change(screen.getByLabelText('Система'), { target: { value: 'Оптима' } });
    await uploadImage(user, container);

    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect(await screen.findByText('Въведете име на компонент')).toBeInTheDocument();
    expect(screen.getByText('Въведете SAP номер.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects a system component whose name matches the product name', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const { container } = renderForm({ submit, productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    fireEvent.change(container.querySelector('#systemComponent-0-name') as HTMLInputElement, {
      target: { value: 'Единична тухла' },
    });

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect(await screen.findByText(DUPLICATE_COMPONENT_NAME_MESSAGE)).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects two system components that share the same name', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const { container } = renderForm({ submit, productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    fireEvent.change(container.querySelector('#systemComponent-0-name') as HTMLInputElement, {
      target: { value: 'Планка' },
    });
    fireEvent.change(container.querySelector('#systemComponent-1-name') as HTMLInputElement, {
      target: { value: 'Планка' },
    });

    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    expect((await screen.findAllByText(DUPLICATE_COMPONENT_NAME_MESSAGE)).length).toBeGreaterThanOrEqual(2);
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends system components in the payload for pavements', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue({});
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img1' }, { status: 201 })));
    const { container } = renderForm({ submit, productKind: PAVEMENT_PRODUCT_KIND });
    await screen.findByLabelText('Име');

    await fillRequiredFields(user);
    fireEvent.change(screen.getByLabelText('Вариант'), { target: { value: 'Сив' } });
    fireEvent.change(screen.getByLabelText('Система'), { target: { value: 'Оптима' } });

    await user.click(screen.getByRole('button', { name: 'Добави компонент' }));
    const setComponent = (field: string, value: string) =>
      fireEvent.change(container.querySelector(`#systemComponent-0-${field}`) as HTMLInputElement, {
        target: { value },
      });
    setComponent('name', 'Планка');
    setComponent('kind', 'Аксесоар');
    setComponent('rawUnitPrice', '2.5');
    setComponent('unitsPerSquareMeter', '4');
    setComponent('palletWeightKg', '300');
    setComponent('countPerPallet', '20');
    setComponent('minimumOrderUnits', '2');
    setComponent('sapNumber', 'SAP-COMP');

    const sourceComboboxes = screen.getAllByRole('combobox');
    await user.click(sourceComboboxes[sourceComboboxes.length - 1]);
    await user.click(await screen.findByRole('option', { name: 'Пловдив' }));
    const feeComboboxes = screen.getAllByRole('combobox');
    await user.click(feeComboboxes[feeComboboxes.length - 2]);
    await user.click(await screen.findByRole('option', { name: 'Намалена' }));

    await uploadImage(user, container);
    await user.click(screen.getByRole('button', { name: 'Създай продукт' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].systemComponents).toEqual([
      {
        name: 'Планка',
        kind: 'Аксесоар',
        priceUnit: 'бр.',
        rawUnitPrice: 2.5,
        unitsPerSquareMeter: 4,
        palletWeightKg: 300,
        countPerPallet: 20,
        minimumOrderUnits: 2,
        sourceLocation: 'Пловдив',
        sapNumber: 'SAP-COMP',
        feeCategory: 'Намалена',
      },
    ]);
  });
});
