import { Button, Modal, Typography } from 'antd';
import type { ConnectionType } from '@/core/connection/ConnectionType';
import { CONNECTOR_OPTIONS } from './connectorOptions';

interface ConnectorSelectionModalProps {
  onChoose: (type: ConnectionType) => void;
  /** Closes setup for now; it shows again on the next visit while there is no connection. */
  onSkip: () => void;
}

export function ConnectorSelectionModal({ onChoose, onSkip }: ConnectorSelectionModalProps) {
  return (
    <Modal
      open
      centered
      width={868}
      closable={false}
      mask={{ closable: false }}
      keyboard={false}
      title={null}
      footer={<Button onClick={onSkip}>Skip</Button>}
    >
      <div className="px-2 pt-4 text-center">
        <Typography.Title level={3} className="!mb-2">
          Setup <span className="text-brand">DataSource</span>
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          To get started, you need to give us access to your DataSource.
          <br />
          Follow the simple steps to complete your setup.
        </Typography.Paragraph>
      </div>
      <ul className="m-0 mx-auto flex max-w-[746px] list-none flex-wrap justify-center gap-5 p-6">
        {CONNECTOR_OPTIONS.map(option => (
          <li key={option.type}>
            <Button
              className="!h-[120px] !w-[160px] shadow-sm"
              title={option.name}
              aria-label={option.name}
              onClick={() => onChoose(option.type)}
            >
              <img src={option.logoUrl} alt="" className="max-h-[64px] max-w-[110px]" />
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
