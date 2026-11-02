import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { dataCookKeys } from '../../dataCookQueries';
import { etlFromDraft, type EtlDraft } from '../draft/etlDraft.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';

/**
 * Save: `PUT data_cook/{id}` with the draft, keeping the schedule and incremental settings (the Save dialog of v1 comes
 * with DC9). An ETL that was only renamed has no id yet: it is created first. v1 went back to My ETL; v2 stays.
 */
export function useSaveEtl(
  draft: EtlDraft,
  dispatch: EtlEditorDispatch,
  /** After the draft was saved: the ETL may have a new id or name, so a new URL. */
  onSaved: (etl: EtlJob) => void
) {
  const service = useDi(EtlService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const save = useMutation({
    mutationFn: async () => {
      const created = draft.etl.id === 0 ? await service.create(draft.displayName) : undefined;
      return service.update({ ...etlFromDraft(draft), id: created?.id ?? draft.etl.id });
    },
    onSuccess: saved => {
      dispatch({ type: 'saved', etl: saved });
      onSaved(saved);
      void message.success('ETL saved');
    },
    onError: error => void message.error(toErrorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: dataCookKeys.all })
  });

  return { save: save.mutate, isSaving: save.isPending };
}
