import '../Settings.css';

/** Puts a tab's settings back to their defaults (v1 `RevertButton`). */
export function RevertButton({ onRevert }: { onRevert: () => void }) {
  return (
    <button type="button" className="revert-setting" onClick={onRevert}>
      Revert to default
    </button>
  );
}
