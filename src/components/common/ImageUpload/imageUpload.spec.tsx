import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { ImageUpload } from './ImageUpload';
import type { IImageUploadHandle } from './types';

const createFile = (name: string, type: string, size = 4) => new File(['x'.repeat(size)], name, { type });

const getFileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;

describe('ImageUpload', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the upload prompt before an image is selected', () => {
    render(<ImageUpload label="Качи изображение" />);

    expect(screen.getByRole('button', { name: 'Качи изображение' })).toBeInTheDocument();
  });

  it('previews the selected image', async () => {
    const { container } = render(<ImageUpload />);

    await userEvent.upload(getFileInput(container), createFile('photo.png', 'image/png'));

    const image = await screen.findByRole('img', { name: 'Преглед на изображението' });
    expect(image).toHaveAttribute('src', 'blob:preview');
  });

  it('opens the file picker when the dropzone is clicked', async () => {
    const { container } = render(<ImageUpload label="Качи" />);
    const clickSpy = vi.spyOn(getFileInput(container), 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Качи' }));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('rejects non-image files with a validation message', async () => {
    const { container } = render(<ImageUpload />);

    await userEvent.upload(getFileInput(container), createFile('doc.pdf', 'application/pdf'), {
      applyAccept: false,
    });

    expect(screen.getByText('Изберете валиден файл с изображение.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('rejects files larger than the configured limit', async () => {
    const { container } = render(<ImageUpload maxSizeBytes={10} />);

    await userEvent.upload(getFileInput(container), createFile('big.png', 'image/png', 20));

    expect(screen.getByText('Файлът е твърде голям (макс. 0 МБ).')).toBeInTheDocument();
  });

  it('reports a required error when validating without an image', () => {
    const ref = createRef<IImageUploadHandle>();
    render(<ImageUpload ref={ref} required />);

    let valid = true;
    act(() => {
      valid = ref.current!.validate();
    });

    expect(valid).toBe(false);
    expect(screen.getByText('Изберете изображение.')).toBeInTheDocument();
  });

  it('uploads the selected image and resolves its id', async () => {
    let capturedContentType: string | null = null;
    server.use(
      http.post('*/images', ({ request }) => {
        capturedContentType = request.headers.get('content-type');

        return HttpResponse.json({ id: 'img_42' });
      })
    );

    const ref = createRef<IImageUploadHandle>();
    const onUploaded = vi.fn();
    const { container } = render(<ImageUpload ref={ref} onUploaded={onUploaded} />);

    await userEvent.upload(getFileInput(container), createFile('photo.png', 'image/png'));
    await screen.findByRole('img');

    let result: string | null = null;
    await act(async () => {
      result = await ref.current!.upload();
    });

    expect(result).toBe('img_42');
    expect(onUploaded).toHaveBeenCalledWith('img_42');
    expect(capturedContentType).toBe('application/octet-stream');
  });

  it('resolves null without uploading when optional and empty', async () => {
    const ref = createRef<IImageUploadHandle>();
    render(<ImageUpload ref={ref} />);

    let result: string | null = 'unset';
    await act(async () => {
      result = await ref.current!.upload();
    });

    expect(result).toBeNull();
  });

  it('surfaces an error when the upload request fails', async () => {
    server.use(http.post('*/images', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));

    const ref = createRef<IImageUploadHandle>();
    const { container } = render(<ImageUpload ref={ref} />);

    await userEvent.upload(getFileInput(container), createFile('photo.png', 'image/png'));
    await screen.findByRole('img');

    let result: string | null = 'unset';
    await act(async () => {
      result = await ref.current!.upload();
    });

    expect(result).toBeNull();
    expect(screen.getByText('Неуспешно качване на изображението. Опитайте отново.')).toBeInTheDocument();
  });

  it('clears the preview when removing the image', async () => {
    const { container } = render(<ImageUpload />);

    await userEvent.upload(getFileInput(container), createFile('photo.png', 'image/png'));
    await screen.findByRole('img');

    await userEvent.click(screen.getByRole('button', { name: 'Премахни изображението' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('shows the provided initial preview image', () => {
    render(<ImageUpload initialPreviewUrl="https://cdn.example/images/img-existing" />);

    expect(screen.getByRole('img', { name: 'Преглед на изображението' })).toHaveAttribute(
      'src',
      'https://cdn.example/images/img-existing'
    );
  });
});
