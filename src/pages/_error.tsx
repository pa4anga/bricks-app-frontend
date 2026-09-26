import type { NextPage, NextPageContext } from 'next';

import { ErrorPage } from '@/components/content/ErrorPage';

interface IErrorProps {
  statusCode: number;
}

const CustomErrorPage: NextPage<IErrorProps> = ({ statusCode }) => <ErrorPage statusCode={statusCode} />;

CustomErrorPage.getInitialProps = ({ res, err }: NextPageContext): IErrorProps => ({
  statusCode: res?.statusCode ?? err?.statusCode ?? 404,
});

export default CustomErrorPage;
