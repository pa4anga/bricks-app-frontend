import type { NextPage } from 'next';

import { ErrorPage } from '@/components/content/ErrorPage';

const ServerErrorPage: NextPage = () => <ErrorPage statusCode={500} />;

export default ServerErrorPage;
