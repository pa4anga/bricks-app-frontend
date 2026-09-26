import { DocumentHeadTags, documentGetInitialProps } from '@mui/material-nextjs/v15-pagesRouter';
import type { DocumentHeadTagsProps } from '@mui/material-nextjs/v15-pagesRouter';
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext, DocumentProps } from 'next/document';

export default function Document(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang="bg">
      <Head>
        <link rel="icon" href="/img/favicon.png" />
        <link
          href="https://fonts.googleapis.com/css?family=Noto+Sans:400,700&subset=latin,latin-ext,cyrillic-ext&display=swap"
          rel="stylesheet"
        />
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};
