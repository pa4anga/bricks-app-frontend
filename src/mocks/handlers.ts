import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

const CONSENT_API = '*/consenti/api/v1';

export const handlers: RequestHandler[] = [
  http.get(`${CONSENT_API}/resolve-profile`, () =>
    HttpResponse.json({ complianceGroup: 'opt-in', locale: 'bg', found: false })
  ),
  http.get(`${CONSENT_API}/profiles/:tenantId/:complianceGroup/:locale`, () =>
    HttpResponse.json({ message: 'Not found' }, { status: 404 })
  ),
  http.post(`${CONSENT_API}/consent`, () =>
    HttpResponse.json({ id: 'test-consent-id', visitorId: 'test-visitor-id' }, { status: 201 })
  ),
];
