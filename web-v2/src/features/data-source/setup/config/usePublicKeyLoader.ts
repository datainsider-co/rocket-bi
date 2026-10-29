import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toErrorMessage } from '@/shared/http/errorMessage';
import type { ConnectionFormValues } from './connectionForm.utils';

/** Fills the read-only public key field the first time the SSH section opens. */
export function usePublicKeyLoader(form: UseFormReturn<ConnectionFormValues>, loadKey: () => Promise<string>) {
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (isLoading || form.getValues('ssh.publicKey')) return;
    setIsLoading(true);
    try {
      form.setValue('ssh.publicKey', await loadKey(), { shouldValidate: form.formState.isSubmitted });
    } catch (error) {
      form.setError('ssh.publicKey', { message: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, load: () => void load() };
}
