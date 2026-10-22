import { SetupProgressView } from './SetupProgressView';
import { useSchemaRefresh } from './useSchemaRefresh';

interface SetupProgressModalProps {
  displayName: string;
  onBack: () => void;
  onFinish: () => void;
}

export function SetupProgressModal({ displayName, onBack, onFinish }: SetupProgressModalProps) {
  const { items, outcome } = useSchemaRefresh(displayName);

  return <SetupProgressView displayName={displayName} items={items} outcome={outcome} onBack={onBack} onNext={onFinish} />;
}
