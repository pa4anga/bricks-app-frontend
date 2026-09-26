import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CsvImportForm } from './CsvImportForm';

const selectFile = async (labelText: string) => {
  const file = new File(['name\nSofia'], 'data.csv', { type: 'text/csv' });
  await userEvent.upload(screen.getByLabelText(labelText), file);
};

describe('CsvImportForm', () => {
  it('disables the submit button until a file is selected', () => {
    render(<CsvImportForm title="Локации" inputId="loc" pickerLabel="Изберете файл" onImport={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Импортирай' })).toBeDisabled();
  });

  it('imports the selected file and shows a summary', async () => {
    const onImport = vi.fn().mockResolvedValue({ created: 2, updated: 1, total: 3 });
    render(<CsvImportForm title="Локации" inputId="loc" pickerLabel="Изберете файл" onImport={onImport} />);

    await selectFile('Изберете файл');
    await userEvent.click(screen.getByRole('button', { name: 'Импортирай' }));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Готово. Създадени: 2, обновени: 1, общо: 3.')).toBeInTheDocument();
  });

  it('shows the server message and per-row errors on failure', async () => {
    const onImport = vi.fn().mockRejectedValue({
      response: { data: { message: 'Невалиден CSV', errors: ['Ред 2: липсва име', 'Ред 5: невалидна цена'] } },
    });
    render(<CsvImportForm title="Продукти" inputId="prod" pickerLabel="Изберете файл" onImport={onImport} />);

    await selectFile('Изберете файл');
    await userEvent.click(screen.getByRole('button', { name: 'Импортирай' }));

    expect(await screen.findByText('Невалиден CSV')).toBeInTheDocument();
    expect(screen.getByText('Ред 2: липсва име')).toBeInTheDocument();
    expect(screen.getByText('Ред 5: невалидна цена')).toBeInTheDocument();
  });
});
