import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';

import { useDeleteProductsId } from '@/api/endpoints/products/products';
import type { Product } from '@/api/model';
import { PaginatedTable, TableActionsMenu } from '@/components/common';
import type { IPaginatedTableColumn, ITableActionItem } from '@/components/common';
import type { IProductKind } from '@/constants/productKinds';
import {
  INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE,
  INTERNAL_PRODUCT_EDIT_ROUTE,
  INTERNAL_PRODUCT_VIEW_ROUTE,
} from '@/constants/routes';

const DELETE_FAILED_MESSAGE = 'Неуспешно изтриване на продукта.';
const EMPTY_CELL = '—';

interface IProductRowActionsProps {
  product: Product;
  productKind: IProductKind;
  onDeleted: () => void;
}

const ProductRowActions = ({ product, productKind, onDeleted }: IProductRowActionsProps) => {
  const id = product._id ?? '';
  const name = product.name ?? '';
  const { trigger, isMutating } = useDeleteProductsId(id);
  const [error, setError] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const closeError = () => setError(previous => ({ ...previous, open: false }));

  const handleDelete = async () => {
    closeError();

    try {
      await trigger();
      onDeleted();
    } catch {
      setError({ open: true, message: DELETE_FAILED_MESSAGE });
    }
  };

  const actions: ITableActionItem[] = [
    { key: 'view', label: 'Преглед', href: INTERNAL_PRODUCT_VIEW_ROUTE(id), ariaLabel: `Преглед ${name}` },
    {
      key: 'create-variant',
      label: 'Създай вариант',
      href: INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE(productKind.slug, id),
      ariaLabel: `Създай вариант от ${name}`,
    },
    { key: 'edit', label: 'Промени', href: INTERNAL_PRODUCT_EDIT_ROUTE(id), ariaLabel: `Промени ${name}` },
    {
      key: 'delete',
      label: 'Изтрий',
      color: 'error',
      disabled: isMutating,
      ariaLabel: `Изтрий ${name}`,
      onClick: () => {
        void handleDelete();
      },
    },
  ];

  return (
    <>
      <TableActionsMenu actions={actions} ariaLabel={`Действия за ${name}`} />
      <Snackbar open={error.open} autoHideDuration={5000} onClose={closeError}>
        <Alert severity="error" onClose={closeError} sx={{ width: '100%' }}>
          {error.message}
        </Alert>
      </Snackbar>
    </>
  );
};

interface IProductsTableProps {
  products: Product[];
  productKind: IProductKind;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onDeleted: () => void;
}

export const ProductsTable = ({
  products,
  productKind,
  page,
  pageCount,
  onPageChange,
  onDeleted,
}: IProductsTableProps) => {
  const columns: IPaginatedTableColumn<Product>[] = [
    { key: 'name', header: 'Име', render: product => product.name ?? EMPTY_CELL },
    { key: 'subtype', header: 'Тип', render: product => product.subtype ?? EMPTY_CELL },
    ...(productKind.showSystem
      ? [
          {
            key: 'system',
            header: 'Система',
            render: product => product.system ?? EMPTY_CELL,
          } satisfies IPaginatedTableColumn<Product>,
        ]
      : []),
    ...(productKind.showVariant
      ? [
          {
            key: 'variant',
            header: 'Вариант',
            render: product => product.variant ?? EMPTY_CELL,
          } satisfies IPaginatedTableColumn<Product>,
        ]
      : []),
    {
      key: 'rawUnitPrice',
      header: 'Единична цена',
      align: 'right',
      render: product => product.rawUnitPrice ?? EMPTY_CELL,
    },
    { key: 'sourceLocation', header: 'Производствена база', render: product => product.sourceLocation ?? EMPTY_CELL },
    { key: 'feeCategory', header: 'Категория надценка', render: product => product.feeCategory ?? EMPTY_CELL },
    { key: 'sapNumber', header: 'SAP номер', render: product => product.sapNumber ?? EMPTY_CELL },
    ...(productKind.showUnitsPerSquareMeter
      ? [
          {
            key: 'unitsPerSquareMeter',
            header: 'Бр./кв.м',
            align: 'right',
            render: product => product.unitsPerSquareMeter ?? EMPTY_CELL,
          } satisfies IPaginatedTableColumn<Product>,
        ]
      : []),
    {
      key: 'actions',
      header: 'Действия',
      align: 'right',
      render: product => <ProductRowActions product={product} productKind={productKind} onDeleted={onDeleted} />,
    },
  ];

  return (
    <PaginatedTable
      columns={columns}
      rows={products}
      getRowKey={product => product._id ?? product.name ?? ''}
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
      ariaLabel={productKind.label}
    />
  );
};
