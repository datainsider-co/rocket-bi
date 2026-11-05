import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { UserAdminService } from '@/core/admin/UserAdminService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { userKeys } from '../../userQueries';
import { profileChanges, type ProfileForm } from './profile.utils';

/** Saves the fields that changed, in one request (v1 sent one per field as it was edited). */
export function useUpdateProfile(username: string, initial: ProfileForm, onSaved: () => void) {
  const service = useDi(UserAdminService);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const changes = profileChanges(initial, values);
      if (Object.keys(changes).length > 0) await service.updateProfile(username, changes);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      onSaved();
    }
  });
  return { run: save.mutate, isPending: save.isPending, errorMessage: save.isError ? toErrorMessage(save.error) : undefined };
}
