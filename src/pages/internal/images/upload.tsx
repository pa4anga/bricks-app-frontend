import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { NextPage } from 'next';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { PageTemplate } from '@/components';
import { ImageUpload } from '@/components/common';
import type { IImageUploadHandle } from '@/components/common';
import { Button } from '@/components/form';
import { INTERNAL_IMAGE_UPLOAD_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_IMAGE_UPLOAD_ROUTE);

const UPLOAD_FAILED_MESSAGE = 'Неуспешно качване на изображението. Опитайте отново.';

const ImageUploadPage: NextPage = () => {
  const imageRef = useRef<IImageUploadHandle>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const handle = imageRef.current;

    if (!handle || !handle.validate()) {
      return;
    }

    setIsUploading(true);
    setSubmitError(undefined);
    setUploadedId(null);

    try {
      const id = await handle.upload();

      if (id) {
        setUploadedId(id);
        handle.clear();
      } else {
        setSubmitError(UPLOAD_FAILED_MESSAGE);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageTemplate title="Качване на изображение" heading="Качване на изображение" internal>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 480, mt: 2 }}>
        <Stack spacing={3}>
          <ImageUpload ref={imageRef} required />
          {submitError && <Alert severity="error">{submitError}</Alert>}
          {uploadedId && (
            <Alert severity="success">
              <Typography variant="body2">Изображението е качено успешно.</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                ID: <strong>{uploadedId}</strong>
              </Typography>
            </Alert>
          )}
          <Box>
            <Button
              type="submit"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {isUploading ? 'Качване…' : 'Качи'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </PageTemplate>
  );
};

export default ImageUploadPage;
