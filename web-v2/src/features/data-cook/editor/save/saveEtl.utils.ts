import { z } from 'zod';
import { incrementalKey, type EtlJob, type IncrementalConfig } from '@/core/data-cook/EtlJob';
import type { EtlGraph } from '@/core/data-cook/etlGraph';
import { formValuesToSchedule, scheduleFormSchema, scheduleToFormValues, type OffsetAt } from '@/shared/schedule/schedule.utils';
import { etlFromDraft, etlNameSchema, type EtlDraft } from '../draft/etlDraft.utils';
import { previewTabLabel } from '../preview/etlPreview.utils';

/**
 * The Save dialog (v1 `SaveEtl`): the ETL's name, when it runs (v1 `SchedulerSettingV2` without Minutely) and how each
 * source table is read on a run (v1 `EtlIncrementalConfig`): whole, or only the rows past a column's last value.
 */

export const IncrementalMode = {
  Full: 'full',
  Incremental: 'incremental'
} as const;

export type IncrementalMode = (typeof IncrementalMode)[keyof typeof IncrementalMode];

export const saveEtlSchema = z.object({
  name: etlNameSchema.shape.name,
  schedule: scheduleFormSchema,
  incremental: z.array(
    z
      .object({
        tblName: z.string(),
        mode: z.enum([IncrementalMode.Full, IncrementalMode.Incremental]),
        column: z.string(),
        value: z.string()
      })
      .refine(row => row.mode === IncrementalMode.Full || row.column !== '', { path: ['column'], message: 'Please select a column' })
  )
});

export type SaveEtlValues = z.infer<typeof saveEtlSchema>;

/** A source table the run reads, with the columns it can go on from. */
export interface IncrementalSource {
  readonly tblName: string;
  readonly label: string;
  readonly columns: readonly { value: string; label: string }[];
}

/** The ETL's source tables (v1 `dataSources`), in graph order. */
export function incrementalSources(graph: EtlGraph): IncrementalSource[] {
  return [...graph.operators.values()].flatMap(operator =>
    operator.kind === 'getData'
      ? [
          {
            tblName: operator.destTable.tblName,
            label: previewTabLabel(operator),
            columns: operator.tableSchema.columns.map(column => ({ value: column.name, label: column.displayName || column.name }))
          }
        ]
      : []
  );
}

/** The dialog's values for the draft: its name, its schedule, each source's run mode (Full unless set). */
export function saveEtlValuesOf(draft: EtlDraft, now: number, offsetAt: OffsetAt): SaveEtlValues {
  return {
    name: draft.displayName,
    schedule: scheduleToFormValues(draft.etl.scheduleTime, now, offsetAt),
    incremental: incrementalSources(draft.graph).map(source => {
      const config = draft.etl.incrementalConfigs[incrementalKey(source.tblName)];
      return config
        ? { tblName: source.tblName, mode: IncrementalMode.Incremental, column: config.columnName, value: config.value }
        : { tblName: source.tblName, mode: IncrementalMode.Full, column: '', value: '' };
    })
  };
}

/** Only incremental sources are stored, under v1's key (`incrementalKey`); v1 dropped Full ones on save too. */
export function incrementalConfigsOf(rows: SaveEtlValues['incremental']): Record<string, IncrementalConfig> {
  return Object.fromEntries(
    rows.filter(row => row.mode === IncrementalMode.Incremental).map(row => [incrementalKey(row.tblName), { columnName: row.column, value: row.value.trim() }])
  );
}

/** The ETL Save sends: the draft with the dialog's name, schedule and run modes. */
export function savedEtlOf(draft: EtlDraft, values: SaveEtlValues, now: number, offsetAt: OffsetAt): EtlJob {
  return {
    ...etlFromDraft(draft),
    displayName: values.name.trim(),
    scheduleTime: formValuesToSchedule(values.schedule, now, offsetAt),
    incrementalConfigs: incrementalConfigsOf(values.incremental)
  };
}
