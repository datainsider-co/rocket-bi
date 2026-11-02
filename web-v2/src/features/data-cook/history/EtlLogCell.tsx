import { useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import type { EtlHistory } from '@/core/data-cook/EtlHistory';
import { logLines, logSummary } from './etlHistory.utils';

/**
 * v1 "Message": the run's log is one line per step, so the cell shows how it ended and "View log" opens all of it.
 * v1 cut the log to the cell.
 */
export function EtlLogCell({ run }: { run: EtlHistory }) {
  const [isOpen, setOpen] = useState(false);
  const lines = logLines(run.message);
  if (lines.length === 0) return <span>--</span>;

  return (
    <span className="flex w-80 max-w-[60vw] items-center gap-2">
      <span className="min-w-0 flex-1 truncate" title={logSummary(run.message)}>
        {logSummary(run.message)}
      </span>
      <Button type="link" size="small" className="!px-0" onClick={() => setOpen(true)}>
        View log
      </Button>
      <Modal
        open={isOpen}
        title={`Run ${run.id}${run.etlName ? ` of ${run.etlName}` : ''}`}
        footer={null}
        width={720}
        onCancel={() => setOpen(false)}
      >
        <Typography.Paragraph className="!mb-0 max-h-[60vh] overflow-auto">
          <pre className="!m-0 whitespace-pre-wrap break-words">{lines.join('\n')}</pre>
        </Typography.Paragraph>
      </Modal>
    </span>
  );
}
