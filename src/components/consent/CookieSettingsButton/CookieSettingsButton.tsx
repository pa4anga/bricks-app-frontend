import { useConsent } from '@consenti/ui/react';
import Button from '@mui/material/Button';

export const CookieSettingsButton = () => {
  const { showModal } = useConsent();

  return (
    <Button variant="contained" onClick={() => showModal()} sx={{ mt: 4 }}>
      Настройки за бисквитки
    </Button>
  );
};
