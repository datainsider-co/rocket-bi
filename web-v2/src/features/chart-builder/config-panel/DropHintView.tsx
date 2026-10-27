import { DragOutlined } from '@ant-design/icons';

/** v1 `DraggableConfig.placeholder`, shown while a zone can take more fields. */
export function DropHintView() {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-black/45 select-none">
      <DragOutlined aria-hidden />
      Drag and drop your fields
    </div>
  );
}
