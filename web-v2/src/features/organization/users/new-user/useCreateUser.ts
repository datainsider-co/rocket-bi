import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { PermissionAdminService } from '@/core/admin/PermissionAdminService';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { isApiError } from '@/shared/http/ApiError';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys } from '../userQueries';
import { EMAIL_EXISTED_REASON, initialPermissions, toNewUser, type NewUserForm } from './newUser.utils';

export interface CreatedUser {
  readonly username: string;
  /** The user exists, but granting the starting permissions failed. */
  readonly permissionError?: string | undefined;
}

/**
 * Creates the user, then grants the starting permissions. A failed grant doesn't undo the creation (v1 said "Create
 * new user failed!" although the user existed).
 */
export function useCreateUser(onCreated: (user: CreatedUser) => void) {
  const users = useDi(UserAdminService);
  const permissions = useDi(PermissionAdminService);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: NewUserForm): Promise<CreatedUser> => {
      const username = await users.create(toNewUser(values));
      const include = initialPermissions(values.userGroup);
      if (include.length === 0) return { username };
      try {
        await permissions.changePermissions(username, include, []);
        return { username };
      } catch (error) {
        return { username, permissionError: toErrorMessage(error) };
      }
    },
    onSuccess: user => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      onCreated(user);
    }
  });

  const error = mutation.error;
  return {
    create: mutation.mutate,
    isPending: mutation.isPending,
    emailExisted: isApiError(error) && error.reason === EMAIL_EXISTED_REASON,
    errorMessage: error ? toErrorMessage(error) : undefined,
    reset: mutation.reset
  };
}
