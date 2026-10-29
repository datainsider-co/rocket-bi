import { Alert, Button, Progress, Space, Typography } from 'antd';
import { isUploadRunning, uploadPercent, uploadSummary } from './csvUpload.utils';
import type { CsvUpload } from './useCsvUpload';

interface CsvUploadStepProps {
  fileName: string;
  /** `database.table`. */
  table: string;
  upload: CsvUpload;
  onClose: () => void;
}

function progressStatus(phase: CsvUpload['state']['phase']) {
  if (phase === 'done') return 'success';
  return phase === 'uploading' ? 'active' : 'exception';
}

/** v1 `UploadData`: progress by chunk; a failed chunk waits to be retried or skipped, or the upload stopped. */
export function CsvUploadStep({ fileName, table, upload, onClose }: CsvUploadStepProps) {
  const { state } = upload;
  const running = isUploadRunning(state.phase);

  return (
    <>
      <Typography.Text strong>{fileName}</Typography.Text>
      <Progress percent={uploadPercent(state)} status={progressStatus(state.phase)} />
      <Typography.Paragraph type="secondary">
        {state.finished} of {state.total} chunks · {state.rowsInserted.toLocaleString('en-US')} rows imported
      </Typography.Paragraph>
      {state.failure && (
        <Alert
          type="error"
          showIcon
          title={`Chunk ${state.failure.chunk} failed`}
          description={state.failure.message}
          action={
            <Space orientation="vertical">
              <Button size="small" type="primary" onClick={upload.retry}>
                Retry
              </Button>
              <Button size="small" onClick={upload.skip}>
                Skip
              </Button>
              <Button size="small" onClick={upload.skipAll}>
                Skip all failures
              </Button>
            </Space>
          }
        />
      )}
      {state.error && <Alert type="error" showIcon title="The import stopped" description={state.error} />}
      {!running && !state.error && (
        <Alert
          type={state.phase === 'done' && state.skipped.length === 0 ? 'success' : 'warning'}
          showIcon
          title={uploadSummary(state, table)}
          description={
            state.skipped.length > 0 && (
              <ul className="m-0 max-h-32 overflow-y-auto pl-4">
                {state.skipped.map(failure => (
                  <li key={failure.chunk}>
                    Chunk {failure.chunk}: {failure.message}
                  </li>
                ))}
              </ul>
            )
          }
        />
      )}
      <div className="mt-4 flex justify-end">
        {running ? (
          <Button danger onClick={upload.stop}>
            Stop
          </Button>
        ) : (
          <Button type="primary" onClick={onClose}>
            Done
          </Button>
        )}
      </div>
    </>
  );
}
