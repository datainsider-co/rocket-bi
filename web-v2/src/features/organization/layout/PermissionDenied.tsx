import { Alert, Button, Result } from 'antd';

interface PermissionDeniedProps {
  /** Set when the check itself failed; offers Retry. */
  error?: string | undefined;
  onRetry?: () => void;
}

/** v1's "You do not have permissions to perform this action!", or the failed permission check. */
export function PermissionDenied({ error, onRetry }: PermissionDeniedProps) {
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title={error}
        action={onRetry && <Button onClick={onRetry}>Retry</Button>}
      />
    );
  }
  return <Result status="403" title="No permission" subTitle="You do not have permissions to perform this action!" />;
}
