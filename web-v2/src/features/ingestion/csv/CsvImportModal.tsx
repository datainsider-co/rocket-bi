import { CsvImportView } from './CsvImportView';
import { useCsvImport } from './useCsvImport';

interface CsvImportModalProps {
  onClose: () => void;
}

/** Mounted while open, so each opening starts from the file step. */
export function CsvImportModal({ onClose }: CsvImportModalProps) {
  return <CsvImportView {...useCsvImport(onClose)} />;
}
