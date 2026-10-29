import { InboxOutlined } from '@ant-design/icons';
import { Alert, Upload } from 'antd';

interface CsvFileStepProps {
  isReading: boolean;
  error: string | undefined;
  onSelect: (files: readonly File[]) => void;
}

/** v1 `BrowseFile`: drop or browse one file. Nothing is uploaded here; the file is only read. */
export function CsvFileStep({ isReading, error, onSelect }: CsvFileStepProps) {
  return (
    <>
      <Upload.Dragger
        accept=".csv,.tsv,.txt,text/csv"
        multiple={false}
        showUploadList={false}
        disabled={isReading}
        beforeUpload={(file, files) => {
          // Called once per file; answer once, for the whole drop.
          if (file === files[0]) onSelect(files);
          return false;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{isReading ? 'Reading the file…' : 'Click or drag a CSV file here'}</p>
        <p className="ant-upload-hint">The first rows are previewed before anything is imported.</p>
      </Upload.Dragger>
      {error && <Alert className="mt-3" type="error" showIcon title={error} />}
    </>
  );
}
