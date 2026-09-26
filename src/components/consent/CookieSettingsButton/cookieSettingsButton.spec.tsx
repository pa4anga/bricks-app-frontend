import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CookieSettingsButton } from './CookieSettingsButton';

const { showModalMock, useConsentMock } = vi.hoisted(() => {
  const showModal = vi.fn();
  return { showModalMock: showModal, useConsentMock: vi.fn(() => ({ showModal })) };
});

vi.mock('@consenti/ui/react', () => ({
  useConsent: useConsentMock,
}));

beforeEach(() => {
  showModalMock.mockClear();
});

describe('CookieSettingsButton', () => {
  it('renders the cookie settings button', () => {
    render(<CookieSettingsButton />);

    expect(screen.getByRole('button', { name: 'Настройки за бисквитки' })).toBeInTheDocument();
  });

  it('opens the cookie preferences modal when clicked', async () => {
    const user = userEvent.setup();

    render(<CookieSettingsButton />);

    await user.click(screen.getByRole('button', { name: 'Настройки за бисквитки' }));

    expect(showModalMock).toHaveBeenCalledTimes(1);
  });
});
