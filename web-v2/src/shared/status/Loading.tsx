import './status.css';

interface LoadingProps {
  /** `full` fills and centers in its parent; `small` is only as big as the spinner. */
  mode?: 'full' | 'small';
}

/** v1 `DiLoading.vue`: the 24px gradient ring, turning. */
export function Loading({ mode = 'full' }: LoadingProps) {
  return (
    <output className={`status-loading${mode === 'full' ? ' status-loading--full' : ''}`} aria-label="Loading">
      <img className="status-loading__icon" src="/icons/loading.svg" alt="" />
    </output>
  );
}
