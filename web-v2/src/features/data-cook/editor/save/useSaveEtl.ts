import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { etlGraphFromLeaves } from '@/core/data-cook/etlGraph';
import { dataCookKeys, etlsChanged } from '../../dataCookQueries';
import { signatureChanges } from '../preview/etlPreview.utils';
import type { EtlEditorDispatch } from '../draft/useEtlEditorState';

/**
 * The previews of what was saved, under the signatures of the ETL the server answered with: it writes a Transform's or
 * Pivot's query its own way, but the tables are the ones the draft built. Without this a save built them again.
 */
function keepPreviews(queryClient: QueryClient, sent: EtlJob, saved: EtlJob) {
  for (const { tblName, from, to } of signatureChanges(etlGraphFromLeaves(sent.operators), etlGraphFromLeaves(saved.operators))) {
    const result = queryClient.getQueryData(dataCookKeys.preview(sent.id, tblName, from));
    if (result !== undefined) queryClient.setQueryData(dataCookKeys.preview(saved.id, tblName, to), result);
  }
}

/**
 * Save: `PUT data_cook/{id}` with the ETL the Save dialog made of the draft. An ETL that was only renamed has no id
 * yet: it is created first. v1 went back to My ETL; v2 stays. A failure keeps the dialog open with the server's
 * message, as v1 did.
 */
export function useSaveEtl(
  dispatch: EtlEditorDispatch,
  /** After the draft was saved: the ETL may have a new id or name, so a new URL. */
  onSaved: (etl: EtlJob) => void
) {
  const service = useDi(EtlService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const save = useMutation({
    mutationFn: async (etl: EtlJob) => {
      const created = etl.id === 0 ? await service.create(etl.displayName) : undefined;
      return service.update({ ...etl, id: created?.id ?? etl.id });
    },
    onSuccess: (saved, sent) => {
      keepPreviews(queryClient, sent, saved);
      dispatch({ type: 'saved', etl: saved });
      onSaved(saved);
      void message.success('ETL saved');
    },
    onSettled: () => void etlsChanged(queryClient)
  });

  return {
    save: (etl: EtlJob, onDone: () => void) => save.mutate(etl, { onSuccess: onDone }),
    isSaving: save.isPending,
    error: save.error ? toErrorMessage(save.error) : undefined,
    reset: save.reset
  };
}
