import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CsvExportButton } from './CsvExportButton';

describe('CsvExportButton', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:csv');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches the CSV and triggers a browser download', async () => {
    const fetchCsv = vi.fn().mockResolvedValue('name\nSofia');
    let downloadedName: string | undefined;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadedName = this.download;
    });

    render(<CsvExportButton label="Експорт" filename="locations.csv" fetchCsv={fetchCsv} />);

    await userEvent.click(screen.getByRole('button', { name: 'Експорт' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(fetchCsv).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(downloadedName).toBe('locations.csv');
  });

  it('shows an error message when the export fails', async () => {
    const fetchCsv = vi.fn().mockRejectedValue(new Error('boom'));

    render(<CsvExportButton label="Експорт" filename="products.csv" fetchCsv={fetchCsv} />);

    await userEvent.click(screen.getByRole('button', { name: 'Експорт' }));

    expect(await screen.findByText('Възникна грешка при експортирането. Опитайте отново.')).toBeInTheDocument();
  });
});
