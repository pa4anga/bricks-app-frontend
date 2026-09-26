import type { NextPage } from 'next';

import { CookieSettingsButton, CookieUsageTable } from '@/components/consent';
import { LegalPage } from '@/components/content/LegalPage';
import { cookiesContent } from '@/content/legal/cookies';

const CookiesPage: NextPage = () => (
  <LegalPage content={cookiesContent}>
    <CookieUsageTable />
    <CookieSettingsButton />
  </LegalPage>
);

export default CookiesPage;
