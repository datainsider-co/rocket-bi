import './status.css';

interface ErrorStateProps {
  message?: string;
  /** Without it there is no Try Again button. */
  onRetry?: () => void;
}

const DEFAULT_MESSAGE = 'Something went wrong, please try again later';

/** v1 `ErrorWidget.vue`: the warning icon, the message cut at four lines (whole in its tooltip), and Try Again. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const text = message || DEFAULT_MESSAGE;
  return (
    <div className="status-error" role="alert">
      <i className="di-icon-warning status-error__icon" aria-hidden />
      <h6 className="status-error__message" title={text}>
        {text}
      </h6>
      {onRetry && (
        <button type="button" className="status-error__retry" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
