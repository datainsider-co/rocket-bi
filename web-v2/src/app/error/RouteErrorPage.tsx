import { useRouteError } from 'react-router';
import { ErrorPageView } from './ErrorPageView';
import { toErrorPageContent } from './errorPage.utils';

/**
 * `errorElement` for routes. Navigates with a full page load: after a crash the in-memory state may be broken, and the
 * root error page can render outside the router's own UI.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <ErrorPageView
      content={toErrorPageContent(error)}
      showDetail={import.meta.env.DEV}
      onGoHome={() => window.location.assign('/')}
      onReload={() => window.location.reload()}
    />
  );
}
