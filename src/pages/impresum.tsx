import type { NextPage } from 'next';

import { LegalPage } from '@/components/content/LegalPage';
import { impresumContent } from '@/content/legal/impresum';

const ImpresumPage: NextPage = () => <LegalPage content={impresumContent} />;

export default ImpresumPage;
