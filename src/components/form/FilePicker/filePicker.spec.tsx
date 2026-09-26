import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FilePicker } from './FilePicker';

const Harness = ({ onChange }: { onChange?: (file: File | null) => void }) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <FilePicker
      id="test-file"
      label="Изберете файл"
      accept=".csv"
      file={file}
      onFileChange={next => {
        setFile(next);
        onChange?.(next);
      }}
    />
  );
};

describe('FilePicker', () => {
  it('shows the placeholder text when no file is selected', () => {
    render(<Harness />);

    expect(screen.getByText('Няма избран файл')).toBeInTheDocument();
  });

  it('reports the selected file and shows its name', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const file = new File(['a,b,c'], 'data.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByLabelText('Изберете файл'), file);

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByText('data.csv')).toBeInTheDocument();
  });

  it('disables the input when disabled', () => {
    render(<FilePicker id="disabled-file" label="Файл" file={null} onFileChange={vi.fn()} disabled />);

    expect(screen.getByLabelText('Файл')).toBeDisabled();
  });
});
