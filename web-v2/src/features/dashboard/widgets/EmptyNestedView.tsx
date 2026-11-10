interface EmptyNestedViewProps {
  /** "Your tab is empty". */
  children: string;
  /** Edit mode: what "Click here" does. Without it only the line shows. */
  onAdd?: () => void;
}

/** v1 `TabViewer` / `FilterPanelViewer` without widgets: a 16px line and "Click here to add" under it. */
export function EmptyNestedView({ children, onAdd }: EmptyNestedViewProps) {
  return (
    <div className="empty-nested">
      {children}
      {onAdd && (
        <div>
          <button type="button" className="empty-nested__add" onClick={onAdd}>
            Click here
          </button>{' '}
          to add
        </div>
      )}
    </div>
  );
}
