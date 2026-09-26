import Alert from '@mui/material/Alert';

import { PageTemplate } from '@/components/layout/PageTemplate';

const DEFAULT_MESSAGE = 'Тази страница ще бъде добавена по-късно.';

interface IProductPlaceholderProps {
  title: string;
  heading: string;
  message?: string;
}

export const ProductPlaceholder = ({ title, heading, message }: IProductPlaceholderProps) => (
  <PageTemplate title={title} heading={heading} internal>
    <Alert severity="info">{message ?? DEFAULT_MESSAGE}</Alert>
  </PageTemplate>
);
