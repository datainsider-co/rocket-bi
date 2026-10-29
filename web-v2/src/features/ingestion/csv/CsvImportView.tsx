import { Modal, Steps } from 'antd';
import { CsvDestinationStep } from './CsvDestinationStep';
import { CsvFileStep } from './CsvFileStep';
import { CsvPreviewStep } from './CsvPreviewStep';
import { CsvUploadStep } from './CsvUploadStep';
import { CSV_IMPORT_STEPS, type CsvImportStep } from './csvWizard.utils';
import type { CsvImportModel } from './useCsvImport';

const STEP_TITLES: Record<CsvImportStep, string> = {
  file: 'File',
  preview: 'Preview',
  destination: 'Destination',
  upload: 'Import'
};

/** The preview needs room for the table; the other steps are a short form. */
const STEP_WIDTHS: Record<CsvImportStep, number> = { file: 560, preview: 1040, destination: 480, upload: 560 };

/** v1 `UploadDocument`: one modal through the steps of a CSV import. It imports once; no source or job is made. */
export function CsvImportView({ step, close, file, preview, destination, upload }: CsvImportModel) {
  return (
    <Modal open centered width={STEP_WIDTHS[step]} title="Import CSV" footer={null} mask={{ closable: false }} onCancel={close}>
      <Steps
        className="mb-6"
        size="small"
        current={CSV_IMPORT_STEPS.indexOf(step)}
        items={CSV_IMPORT_STEPS.map(key => ({ title: STEP_TITLES[key] }))}
      />
      {step === 'file' && <CsvFileStep {...file} />}
      {step === 'preview' && <CsvPreviewStep {...preview} />}
      {step === 'destination' && <CsvDestinationStep destination={destination.form} onBack={destination.onBack} />}
      {step === 'upload' && <CsvUploadStep {...upload} />}
    </Modal>
  );
}
