import { CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { RefreshOutcome, StageItem, StageItemStatus } from './setupProgress.utils';

const STATUS_ICONS: Record<StageItemStatus, ReactNode> = {
  pending: <ClockCircleOutlined className="text-gray-400" />,
  running: <LoadingOutlined className="text-brand" />,
  success: <CheckCircleFilled className="text-green-600" />,
  error: <CloseCircleFilled className="text-red-500" />
};

interface SetupProgressViewProps {
  displayName: string;
  items: StageItem[];
  outcome: RefreshOutcome;
  onBack: () => void;
  /** Enabled once the refresh succeeded. */
  onNext: () => void;
}

export function SetupProgressView({ displayName, items, outcome, onBack, onNext }: SetupProgressViewProps) {
  return (
    <Modal
      open
      centered
      width={720}
      closable={false}
      mask={{ closable: false }}
      keyboard={false}
      title={`${displayName} Config Progress`}
      footer={[
        <Button key="back" onClick={onBack}>
          Back
        </Button>,
        <Button key="next" type="primary" disabled={outcome.kind !== 'success'} onClick={onNext}>
          Next
        </Button>
      ]}
    >
      <Typography.Paragraph>
        You&apos;re almost there! Just a few more steps and you&apos;ll be ready to go. Hang on while we:
      </Typography.Paragraph>
      <ol className="m-0 flex list-none flex-col gap-4 p-0" aria-label="Setup steps">
        {items.map(item => (
          <li key={item.name} className="flex items-center gap-3" data-status={item.status}>
            {STATUS_ICONS[item.status]}
            <span>
              {item.label}
              {item.progressText && <Typography.Text type="secondary"> ({item.progressText})</Typography.Text>}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        {outcome.kind === 'success' && (
          <Alert
            type="success"
            showIcon
            title="Woohoo! You did it! Your RocketBI setup is complete. Explore our amazing features now!"
          />
        )}
        {outcome.kind === 'error' && <Alert type="error" showIcon title="Error" description={outcome.message} />}
        {outcome.kind === 'terminated' && <Alert type="warning" showIcon title="The progress is terminated!" />}
      </div>
    </Modal>
  );
}
