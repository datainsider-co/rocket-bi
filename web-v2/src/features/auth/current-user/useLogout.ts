import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { clearSession } from '@/core/session/session';

/**
 * Ends the session on the server (v1 only dropped the cookie), then locally even if that call fails. Navigates away
 * before clearing the cache, so the app layout does not refetch the user without a session.
 */
export function useLogout() {
  const service = useDi(AuthenticationService);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => service.logout(),
    onSettled: async () => {
      clearSession();
      await navigate('/login', { replace: true });
      queryClient.clear();
    }
  });

  return { logout: () => mutation.mutate(), isPending: mutation.isPending };
}
