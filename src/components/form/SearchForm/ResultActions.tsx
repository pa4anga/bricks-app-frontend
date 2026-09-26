import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

interface IResultActionsProps {
  systemComponentsHref?: string;
}

// No browser API saves a page to PDF without the print dialog, so Save also uses print().
const openPrintDialog = () => window.print();

export const ResultActions = ({ systemComponentsHref }: IResultActionsProps) => (
  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
    {systemComponentsHref && (
      <Button variant="contained" component={Link} href={systemComponentsHref}>
        Системни компоненти
      </Button>
    )}
    <Button variant="outlined" startIcon={<PrintIcon />} onClick={openPrintDialog}>
      Печат
    </Button>
    <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={openPrintDialog}>
      Запази като PDF
    </Button>
  </Stack>
);
