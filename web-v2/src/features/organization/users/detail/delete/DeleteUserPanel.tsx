import { Alert, Button, Card, Radio, Typography } from 'antd';
import { TransferUserSelect } from './TransferUserSelect';
import type { DeleteUserControls } from './useDeleteUser';

interface DeleteUserPanelProps {
  username: string;
  name: string;
  controls: DeleteUserControls;
  onCancel: () => void;
}

/** v1 `UserDeletion`, with the copy of "Don't transfer" fixed (v1 said the data would be transferred). */
export function DeleteUserPanel({ username, name, controls, onCancel }: DeleteUserPanelProps) {
  const { choice, setChoice, error, isPending, errorMessage, submit } = controls;

  return (
    <Card
      title={`Delete ${name}`}
      extra={
        <div className="flex gap-2">
          <Button disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button danger type="primary" loading={isPending} onClick={submit}>
            Delete
          </Button>
        </div>
      }
    >
      <Radio.Group
        className="flex flex-col gap-4"
        value={choice.mode}
        disabled={isPending}
        onChange={event => setChoice({ ...choice, mode: event.target.value as typeof choice.mode })}
      >
        <Radio value="transfer">
          <div>Transfer ownership of {name}&apos;s data to another user</div>
          <Typography.Text type="secondary" className="text-sm">
            Their dashboards and folders move to the user you pick.
          </Typography.Text>
        </Radio>
        {choice.mode === 'transfer' && (
          <div className="ml-6 max-w-md">
            <TransferUserSelect
              excludedUsername={username}
              value={choice.transferTo}
              disabled={isPending}
              onChange={transferTo => setChoice({ ...choice, transferTo })}
            />
            {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
          </div>
        )}
        <Radio value="delete">
          <div>Don&apos;t transfer data</div>
          <Typography.Text type="secondary" className="text-sm">
            Their dashboards and folders are deleted with them.
          </Typography.Text>
        </Radio>
      </Radio.Group>
      {errorMessage && <Alert className="mt-4" type="error" showIcon title={errorMessage} />}
    </Card>
  );
}
