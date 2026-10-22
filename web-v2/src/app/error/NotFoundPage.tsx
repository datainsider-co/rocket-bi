import { useNavigate } from 'react-router';
import { ErrorPageView } from './ErrorPageView';
import { NOT_FOUND } from './errorPage.utils';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <ErrorPageView
      content={NOT_FOUND}
      showDetail={false}
      onGoHome={() => void navigate('/')}
      onReload={() => window.location.reload()}
    />
  );
}
