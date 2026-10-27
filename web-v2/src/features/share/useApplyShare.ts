import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { ShareService } from '@/core/share/ShareService';
import type { SharePlan } from './applyShare';
import { applyShare } from './applyShare';
import { shareKeys } from './shareQueries';

/** Apply: sends the plan, then refreshes what the dialog reads and tells the caller. A failure keeps the dialog open. */
export function useApplyShare(onDone: () => void) {
  const share = useDi(ShareService);
  const directories = useDi(DirectoryService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (plan: SharePlan) => applyShare(plan, { share, directories }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shareKeys.all });
      onDone();
    },
    onError: error => void message.error(error.message),
    // A partial failure may have changed some of it.
    onSettled: (_data, error) => (error ? queryClient.invalidateQueries({ queryKey: shareKeys.all }) : undefined)
  });
}
