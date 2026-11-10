import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { userDetailQueryOptions } from '../userQueries';

export function useUserDetail(username: string) {
  return useQuery(userDetailQueryOptions(useDi(UserAdminService), username));
}
