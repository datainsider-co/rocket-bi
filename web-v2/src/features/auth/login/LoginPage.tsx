import { useNavigate, useSearchParams } from 'react-router';
import { parseLoginSearch } from '../redirect.utils';
import { LoginForm } from './LoginForm';
import { useLogin } from './useLogin';

/** v1 `window.appConfig.REGISTER_URL`. */
const REGISTER_URL: string = import.meta.env.VITE_REGISTER_URL ?? 'https://rocket.bi/register';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const { redirect } = parseLoginSearch(Object.fromEntries(searchParams));
  const { login, isPending, errorMessage } = useLogin(redirect);
  const navigate = useNavigate();

  return (
    <LoginForm
      isPending={isPending}
      errorMessage={errorMessage}
      registerUrl={REGISTER_URL}
      onLogin={login}
      onForgotPassword={() => void navigate('/forgot-password')}
    />
  );
}
