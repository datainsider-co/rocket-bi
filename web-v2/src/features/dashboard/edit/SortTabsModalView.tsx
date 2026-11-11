import { useState, type KeyboardEvent } from 'react';
import { closestCenter, DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragOverEvent } from '@dnd-kit/core';
import { HeaderDialog } from '../dialogs/HeaderDialog';
import { moveInOrder, movedTo } from './tabEdit.utils';
import './editDialogs.css';

interface SortTabsModalViewProps {
  names: readonly string[];
  /** The tabs' current indexes, in their new order. */
  onSubmit: (order: number[]) => Promise<void>;
  onCancel: () => void;
}

interface SortRowProps {
  /** The tab's index before sorting; its id while dragging. */
  tab: number;
  name: string;
  /** Moves the row one step with the arrow keys. */
  onStep: (step: -1 | 1) => void;
}

function SortRowLabel({ name }: { name: string }) {
  return (
    <>
      <span className="sort-tabs__name">{name}</span>
      <i className="di-icon-drag" aria-hidden />
    </>
  );
}

function SortRow({ tab, name, onStep }: SortRowProps) {
  const draggable = useDraggable({ id: tab });
  const droppable = useDroppable({ id: tab });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    onStep(event.key === 'ArrowUp' ? -1 : 1);
  };
  return (
    <button
      type="button"
      ref={node => {
        draggable.setNodeRef(node);
        droppable.setNodeRef(node);
      }}
      className="sort-tabs__row"
      data-dragging={draggable.isDragging}
      {...draggable.listeners}
      {...draggable.attributes}
      aria-label={`${name}, drag or use the arrow keys to move`}
      onKeyDown={onKeyDown}
    >
      <SortRowLabel name={name} />
    </button>
  );
}

/** v1 `SortModal`: the tabs, dragged into a new order. The arrow keys move the focused row too. */
export function SortTabsModalView({ names, onSubmit, onCancel }: SortTabsModalViewProps) {
  const [order, setOrder] = useState(() => names.map((_name, index) => index));
  const [dragged, setDragged] = useState<number>();
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const nameOf = (tab: number) => names[tab] || 'Untitled tab';

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || over.id === active.id) return;
    setOrder(current => movedTo(current, current.indexOf(Number(active.id)), current.indexOf(Number(over.id))));
  };
  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(order);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeaderDialog title="Sort Orders" subtitle="Drag to customize the order" actionName="Save" width={444} saving={saving} onSubmit={() => void submit()} onCancel={onCancel}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setDragged(Number(active.id))}
        onDragOver={onDragOver}
        onDragEnd={() => setDragged(undefined)}
        onDragCancel={() => setDragged(undefined)}
      >
        <div className="sort-tabs">
          {order.map((tab, position) => (
            <SortRow key={tab} tab={tab} name={nameOf(tab)} onStep={step => setOrder(moveInOrder(order, position, step))} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragged !== undefined && (
            <div className="sort-tabs__row sort-tabs__row--ghost">
              <SortRowLabel name={nameOf(dragged)} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </HeaderDialog>
  );
}
