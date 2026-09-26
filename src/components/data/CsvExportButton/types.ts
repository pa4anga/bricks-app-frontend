export interface ICsvExportButtonProps {
  label: string;
  filename: string;
  fetchCsv: () => Promise<string>;
}
