import type { Connection } from '@/core/connection/Connection';
import { toFormValues } from './connectionForm.utils';
import { ConnectorConfigView } from './ConnectorConfigView';
import { useConnectorConfig } from './useConnectorConfig';

interface ConnectorConfigModalProps {
  /** Prefills the form: an empty one of the chosen type, or the saved connection to fix. */
  connection: Connection;
  onSaved: (connection: Connection) => void;
  onBack: () => void;
}

export function ConnectorConfigModal({ connection, onSaved, onBack }: ConnectorConfigModalProps) {
  const { test, save, loadPublicKey } = useConnectorConfig(onSaved);

  return (
    <ConnectorConfigView
      title={connection.displayName}
      initialValues={toFormValues(connection)}
      test={test}
      save={save}
      onBack={onBack}
      onLoadPublicKey={loadPublicKey}
    />
  );
}
