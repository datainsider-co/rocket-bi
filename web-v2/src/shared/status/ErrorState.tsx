import { useCopyText } from '@/shared/hooks/useCopyText';
import './status.css';

interface ErrorStateProps {
  message?: string;
  /** Without it there is no Try Again button. */
  onRetry?: () => void;
}

const DEFAULT_MESSAGE = 'Something went wrong, please try again later';

/**
 * v1 `ErrorWidget.vue`: the warning icon, the message cut at four lines (whole in its tooltip), Try Again, and a
 * button that copies the message, which is how a cut one gets reported.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const text = message || DEFAULT_MESSAGE;
  const copy = useCopyText();
  return (
    <div className="status-error" role="alert">
      <i className="di-icon-warning status-error__icon" aria-hidden />
      <h6 className="status-error__message" title={text}>
        {text}
      </h6>
      <div className="status-error__actions">
        {onRetry && (
          <button type="button" className="status-error__retry" onClick={onRetry}>
            Try Again
          </button>
        )}
        <button type="button" className="status-error__copy" aria-label="Copy error message" title="Copy" onClick={() => void copy(text)}>
          <i className="di-icon-copy-2" aria-hidden />
        </button>
      </div>
    </div>
  );
}
