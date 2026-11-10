import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { LoginMethodService } from '@/core/admin/LoginMethodService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { googleLoginMethodKey, googleLoginMethodQueryOptions } from '../userQueries';
import { toGoogleLoginMethod, toLoginMethodForm, type LoginMethodForm } from './loginMethod.utils';

/** The stored Google login and its save. The modal closes only once the save went through (v1 closed before). */
export function useLoginMethod(onSaved: () => void) {
  const service = useDi(LoginMethodService);
  const queryClient = useQueryClient();
  const query = useQuery(googleLoginMethodQueryOptions(service));

  const save = useMutation({
    mutationFn: (values: LoginMethodForm) => {
      if (!query.data) throw new Error('The login method is not loaded yet');
      return service.saveGoogle(toGoogleLoginMethod(query.data, values));
    },
    onSuccess: saved => {
      queryClient.setQueryData(googleLoginMethodKey, saved);
      onSaved();
    }
  });

  return {
    initialValues: query.data ? toLoginMethodForm(query.data) : undefined,
    loadError: query.isError ? toErrorMessage(query.error) : undefined,
    save: { run: save.mutate, isPending: save.isPending, errorMessage: save.isError ? toErrorMessage(save.error) : undefined }
  };
}
