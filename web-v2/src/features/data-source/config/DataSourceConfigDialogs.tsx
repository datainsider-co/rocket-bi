import { ConnectorConfigModal } from '../setup/config/ConnectorConfigModal';
import { SetupProgressModal } from '../setup/progress/SetupProgressModal';
import { ConnectorSelectionModal } from '../setup/select/ConnectorSelectionModal';
import type { useConfigDialog } from './useConfigDialog';

interface DataSourceConfigDialogsProps {
  dialogs: ReturnType<typeof useConfigDialog>;
}

/** The first-run setup modals, opened from the DataSource page (v1 `ConnectorConfig.vue`'s three modals). */
export function DataSourceConfigDialogs({ dialogs }: DataSourceConfigDialogsProps) {
  const { dialog } = dialogs;

  switch (dialog.kind) {
    case 'select':
      return <ConnectorSelectionModal onChoose={dialogs.choose} onSkip={dialogs.close} skipLabel="Cancel" />;
    case 'config':
      return (
        <ConnectorConfigModal
          connection={dialog.connection}
          onSaved={dialogs.saved}
          onBack={dialog.backTo === 'close' ? dialogs.close : dialogs.backToSelect}
          backLabel={dialog.backTo === 'close' ? 'Cancel' : 'Back'}
        />
      );
    case 'progress':
      return (
        <SetupProgressModal
          displayName={dialog.connection.displayName}
          onBack={() => dialogs.backFromProgress(dialog.connection)}
          onFinish={dialogs.finish}
        />
      );
    case 'none':
      return null;
  }
}
