import { Alert, Button } from 'antd';

/** A saved connection of a type v2 doesn't know: it can only be replaced (v1 refused Edit with an error). */
export function UnknownConnectionCard({ onChange }: { onChange: () => void }) {
  return (
    <Alert
      type="warning"
      showIcon
      title="Unknown DataSource type"
      description="This DataSource can't be edited here. Change it to set up a new one."
      action={<Button onClick={onChange}>Change</Button>}
    />
  );
}
