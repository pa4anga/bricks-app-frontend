import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { usePostImages } from '@/api/endpoints/images/images';

import type { IImageUploadHandle, IImageUploadProps } from './types';

import styles from './imageUpload.module.scss';

const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024;
const DEFAULT_LABEL = 'Кликнете за качване на изображение';
const INVALID_TYPE_MESSAGE = 'Изберете валиден файл с изображение.';
const DEFAULT_REQUIRED_MESSAGE = 'Изберете изображение.';
const DEFAULT_UPLOAD_ERROR_MESSAGE = 'Неуспешно качване на изображението. Опитайте отново.';

const formatTooLargeMessage = (maxSizeBytes: number) =>
  `Файлът е твърде голям (макс. ${Math.round(maxSizeBytes / (1024 * 1024))} МБ).`;

export const ImageUpload = ({
  ref,
  label = DEFAULT_LABEL,
  hint,
  error,
  initialPreviewUrl,
  accept = 'image/*',
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  required = false,
  disabled = false,
  requiredMessage = DEFAULT_REQUIRED_MESSAGE,
  uploadErrorMessage = DEFAULT_UPLOAD_ERROR_MESSAGE,
  onFileChange,
  onUploaded,
  width,
  height,
  className,
}: IImageUploadProps) => {
  const { trigger, isMutating } = usePostImages();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl ?? null);
  const [errorState, setErrorState] = useState<string | undefined>(error);

  useEffect(() => {
    setErrorState(error);
  }, [error]);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => releasePreview, [releasePreview]);

  const validateFile = useCallback(
    (file: File | null): string | undefined => {
      if (!file) {
        return required ? requiredMessage : undefined;
      }

      if (!file.type.startsWith('image/')) {
        return INVALID_TYPE_MESSAGE;
      }

      if (file.size > maxSizeBytes) {
        return formatTooLargeMessage(maxSizeBytes);
      }

      return undefined;
    },
    [required, requiredMessage, maxSizeBytes]
  );

  const setFile = useCallback(
    (file: File | null) => {
      fileRef.current = file;
      releasePreview();

      if (file) {
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setPreview(url);
      } else {
        setPreview(null);
      }

      onFileChange?.(file);
    },
    [releasePreview, onFileChange]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) {
      return;
    }

    const message = validateFile(file);

    if (message) {
      setErrorState(message);

      return;
    }

    setFile(file);
    setErrorState(undefined);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setFile(null);
    setErrorState(undefined);
  };

  const validate = useCallback(() => {
    const message = validateFile(fileRef.current);
    setErrorState(message);

    return !message;
  }, [validateFile]);

  const upload = useCallback(async () => {
    const message = validateFile(fileRef.current);
    setErrorState(message);

    if (message || !fileRef.current) {
      return null;
    }

    try {
      const response = await trigger(fileRef.current);
      const id = response?.id ?? null;

      if (id) {
        onUploaded?.(id);
      }

      return id;
    } catch {
      setErrorState(uploadErrorMessage);

      return null;
    }
  }, [validateFile, trigger, onUploaded, uploadErrorMessage]);

  const clear = useCallback(() => {
    setFile(null);
    setErrorState(undefined);
  }, [setFile]);

  useImperativeHandle(
    ref,
    (): IImageUploadHandle => ({
      upload,
      validate,
      clear,
      getFile: () => fileRef.current,
    }),
    [upload, validate, clear]
  );

  return (
    <div className={className}>
      <div className={styles.root}>
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
        />
        <ButtonBase
          className={styles.dropzone}
          onClick={openFilePicker}
          disabled={disabled || isMutating}
          focusRipple
          aria-label={label}
          sx={{ width, height, ...(errorState ? { borderColor: 'error.main' } : {}) }}
        >
          {preview ? (
            <Box component="img" src={preview} alt="Преглед на изображението" className={styles.preview} />
          ) : (
            <span className={styles.placeholder}>
              <AddPhotoAlternateOutlinedIcon className={styles.icon} color="action" />
              <Typography variant="body2">{label}</Typography>
            </span>
          )}
          {isMutating && (
            <span className={styles.overlay}>
              <CircularProgress size={40} aria-label="Качване" />
            </span>
          )}
        </ButtonBase>
        {preview && !disabled && !isMutating && (
          <IconButton className={styles.remove} onClick={handleRemove} aria-label="Премахни изображението" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      {(errorState || hint) && (
        <FormHelperText error={Boolean(errorState)} className={styles.helper}>
          {errorState ?? hint}
        </FormHelperText>
      )}
    </div>
  );
};
