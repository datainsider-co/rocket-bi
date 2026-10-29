import { Alert, Button, Typography } from 'antd';
import { CsvPreviewTable, type CsvColumnEdit } from './CsvPreviewTable';
import { CsvSettingsPanel } from './CsvSettingsPanel';
import type { CsvReadSetting } from './csvWizard.utils';
import type { CsvPreviewResult } from './useCsvPreview';

interface CsvPreviewStepProps {
  setting: CsvReadSetting;
  onSettingChange: (setting: Partial<CsvReadSetting>) => void;
  preview: CsvPreviewResult;
  columnEdit: CsvColumnEdit;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
}

/** v1 `PreviewFile`: the first rows as the server reads them, how to read the file, and the columns to edit. */
export function CsvPreviewStep({ setting, onSettingChange, preview, columnEdit, canContinue, onBack, onNext }: CsvPreviewStepProps) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="min-w-0 flex-1">
          {preview.errorMessage ? (
            <Alert
              type="error"
              showIcon
              title="Couldn't read the file this way"
              description={preview.errorMessage}
              action={
                <Button size="small" onClick={preview.retry}>
                  Retry
                </Button>
              }
            />
          ) : (
            <CsvPreviewTable columns={preview.columns} records={preview.records} edit={columnEdit} isLoading={preview.isLoading} />
          )}
        </div>
        <div className="md:w-56">
          <CsvSettingsPanel setting={setting} disabled={preview.isLoading} onChange={onSettingChange} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Typography.Text type="secondary" className="mr-auto">
          Previewing the first {preview.records.length} rows
        </Typography.Text>
        <Button onClick={onBack}>Back</Button>
        <Button type="primary" disabled={!canContinue} onClick={onNext}>
          Next
        </Button>
      </div>
    </>
  );
}
