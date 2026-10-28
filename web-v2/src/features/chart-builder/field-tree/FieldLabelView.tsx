import { FunctionOutlined } from '@ant-design/icons';
import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import type { FieldIcon, FieldLook } from './fieldTree.utils';

function FieldIconView({ icon }: { icon: FieldIcon }) {
  switch (icon.kind) {
    case 'type':
      return <ColumnTypeIcon type={icon.type} />;
    case 'measure':
      return <FunctionOutlined className="shrink-0 text-[var(--color-brand)]" aria-hidden />;
    case 'image':
      return <img src={icon.src} alt="" className="h-4 w-4 shrink-0" />;
  }
}

interface FieldLabelViewProps {
  look: FieldLook;
  /** The drag image: the row lifted off the panel. */
  dragging?: boolean;
}

/** A field's icon and name, the same in the tree and in the drag image, so the dragged card is the row picked up. */
export function FieldLabelView({ look, dragging = false }: FieldLabelViewProps) {
  const state = dragging ? 'cursor-grabbing bg-white shadow-md ring-1 ring-black/10' : 'cursor-grab hover:bg-black/5';
  return (
    <div className={`flex items-center gap-2 rounded px-2 py-1.5 ${state}`} title={look.title}>
      <FieldIconView icon={look.icon} />
      <span className={`truncate ${look.italic ? 'italic' : ''}`}>{look.title}</span>
    </div>
  );
}
