import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { saveSession } from '@/core/session/session';
import { toLoginErrorMessage } from '../auth.utils';
import { toSafeRedirect } from '../redirect.utils';
import type { LoginValues } from '../auth.utils';
import { currentUserQueryKey } from '../current-user/currentUserQuery';

/**
 * Logs in, stores the session cookie, seeds the current user so the next page needs no extra request, then goes to
 * `redirect` (v1's `previous_screen`) or home.
 */
export function useLogin(redirect: string | undefined) {
  const service = useDi(AuthenticationService);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginValues) => service.login(email, password),
    onSuccess: response => {
      saveSession(response.session.value, response.session.maxAge);
      queryClient.setQueryData(currentUserQueryKey, response);
      void navigate(toSafeRedirect(redirect), { replace: true });
    }
  });

  return {
    login: (values: LoginValues) => mutation.mutate(values),
    isPending: mutation.isPending,
    errorMessage: mutation.error ? toLoginErrorMessage(mutation.error) : undefined
  };
}
