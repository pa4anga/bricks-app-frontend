import type { NextPage } from 'next';

import { LegalPage } from '@/components/content/LegalPage';
import { termsContent } from '@/content/legal/terms';

const TermsPage: NextPage = () => <LegalPage content={termsContent} />;

export default TermsPage;
