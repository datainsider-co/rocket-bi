import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { currentUserQueryOptions } from './currentUserQuery';

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions(useDi(AuthenticationService)));
}
