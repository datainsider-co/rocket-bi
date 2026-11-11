import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import type { FieldIcon, FieldLook } from './fieldTree.utils';
import './FieldTree.css';

const ICON_COLOR = 'var(--accent, var(--color-brand))';

/** v1 `FunctionIcon.vue`: "fx" on the accent circle the column types use. */
const MEASURE_GLYPH =
  'M9 3c1.103 0 2 .897 2 2h-1a1.001 1.001 0 0 0-2 0v1.5h1.25v1H8v3.25c0 1.103-.897 2-2 2s-2-.897-2-2h1a1.001 1.001 0 0 0 2 0V7.5H5.75v-1H7V5c0-1.103.897-2 2-2zm2.927 6.823a.25.25 0 0 1 0 .354l-.824.823.824.823a.25.25 0 1 1-.354.354l-.823-.824-.823.824a.25.25 0 0 1-.354 0 .25.25 0 0 1 0-.354l.824-.823-.824-.823a.25.25 0 1 1 .354-.354l.823.824.823-.824a.25.25 0 0 1 .354 0z';

function FieldIconView({ icon }: { icon: FieldIcon }) {
  switch (icon.kind) {
    case 'type':
      return <ColumnTypeIcon type={icon.type} color={ICON_COLOR} />;
    case 'measure':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="8" fill={ICON_COLOR} />
          <path d={MEASURE_GLYPH} fill="#fff" />
        </svg>
      );
    case 'image':
      return <img src={icon.src} alt="" width={16} height={16} />;
  }
}

interface FieldLabelViewProps {
  look: FieldLook;
  /** The drag image: the row lifted off the panel. */
  dragging?: boolean;
}

/**
 * A field's icon and name, the same in the tree and in the drag image, so the dragged card is the row picked up (v1
 * `.drag-image`: a move glyph before the icon, in a thin accent border).
 */
export function FieldLabelView({ look, dragging = false }: FieldLabelViewProps) {
  return (
    <div className={`field-tree__field${dragging ? ' field-tree__field--dragging' : ''}`} title={look.title}>
      {dragging && <img className="field-tree__move" src="/icons/move.svg" alt="" />}
      <FieldIconView icon={look.icon} />
      <span className={`field-tree__field-name${look.italic ? ' field-tree__field-name--italic' : ''}`}>{look.title}</span>
    </div>
  );
}
