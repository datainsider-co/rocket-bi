import { Button } from 'antd';

/** Puts a tab's settings back to their defaults (v1 `RevertButton`). */
export function RevertButton({ onRevert }: { onRevert: () => void }) {
  return (
    <div className="text-right">
      <Button type="link" size="small" onClick={onRevert}>
        Revert to default
      </Button>
    </div>
  );
}
