import { Button } from 'antd';

export interface SectionActions {
  isApplying: boolean;
  onCancel: () => void;
  onApply: () => void;
}

/** Cancel and Apply, side by side at full width (v1). Both sections apply every change. */
export function SectionFooter({ isApplying, onCancel, onApply }: SectionActions) {
  return (
    <div className="flex gap-2">
      <Button className="h-[42px] flex-1" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="primary" className="h-[42px] flex-1" loading={isApplying} onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
