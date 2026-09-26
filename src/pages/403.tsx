import type { NextPage } from 'next';

import { ErrorPage } from '@/components/content/ErrorPage';

const ForbiddenPage: NextPage = () => <ErrorPage statusCode={403} />;

export default ForbiddenPage;
