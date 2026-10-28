import { z } from 'zod';
import { JdbcDatabaseType, type DataSource, type JdbcSource, type SourceId } from '@/core/ingestion/DataSource';
import {
  DEFAULT_LAST_SYNCED_VALUE,
  JobClassName,
  newJdbcJob,
  SyncMode,
  type JdbcJob,
  type JdbcJobClassName,
  type JdbcJobValues
} from '@/core/ingestion/Job';
import { requiredError } from '@/shared/form/fieldErrors';
import {
  defaultScheduleFormValues,
  Frequency,
  formValuesToSchedule,
  ScheduleMode,
  scheduleFormSchema,
  scheduleToFormValues,
  type OffsetAt
} from '@/shared/schedule/schedule.utils';

/**
 * The job form (one `JobFormModal` for v1's `JobCreationModal` and `MultiJobCreationModal`), for `jdbc_job` and
 * `generic_jdbc_job`: both read one table, or several, of a JDBC source into a warehouse table.
 *
 * Creating a job can pick several tables: one job per table, through `job/multi_create`. Editing is always one table.
 */

/** What the job form opens on. `lockSource` keeps the source picked (opened from a source, or right after creating one). */
export type JobFormTarget =
  | { readonly mode: 'create'; readonly source?: JdbcSource | undefined; readonly lockSource: boolean }
  | { readonly mode: 'edit'; readonly job: JdbcJob };

export const jobFormSchema = z
  .object({
    displayName: z.string(),
    sourceId: z.number().nullable(),
    databaseName: z.string(),
    /** One for an edit; one or more for a create. */
    tableNames: z.array(z.string()),
    destDatabaseName: z.string(),
    /** Only with one table; with more, each job writes to a table named like its source table. */
    destTableName: z.string(),
    syncMode: z.enum([SyncMode.FullSync, SyncMode.IncrementalSync]),
    incrementalColumn: z.string(),
    /** v1 "Start value": incremental sync reads rows after it. */
    lastSyncedValue: z.string(),
    schedule: scheduleFormSchema
  })
  .superRefine((values, ctx) => {
    const fail = (path: (string | number)[], message: string | undefined) => {
      if (message) ctx.addIssue({ code: 'custom', path, message });
    };
    const tables = cleanTableNames(values.tableNames);

    fail(['displayName'], requiredError(values.displayName, 'Job name'));
    if (values.sourceId === null) fail(['sourceId'], 'Select a data source, please');
    fail(['databaseName'], requiredError(values.databaseName, 'Database name'));
    if (tables.length === 0) fail(['tableNames'], 'Table name is required!');
    fail(['destDatabaseName'], requiredError(values.destDatabaseName, 'Destination database'));
    if (tables.length <= 1) fail(['destTableName'], requiredError(values.destTableName, 'Destination table'));
    if (values.syncMode === SyncMode.IncrementalSync) {
      fail(['incrementalColumn'], requiredError(values.incrementalColumn, 'Incremental column'));
      fail(['lastSyncedValue'], requiredError(values.lastSyncedValue, 'Start value'));
    }
    if (!allowsMinutely(tables.length) && isMinutely(values.schedule)) {
      fail(['schedule', 'frequency'], 'Minutely syncs one table at a time; pick a longer frequency');
    }
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;

/** Table names as picked: trimmed, without blanks or repeats. */
export function cleanTableNames(tableNames: readonly string[]): string[] {
  return [...new Set(tableNames.map(name => name.trim()).filter(Boolean))];
}

/**
 * Minutely is offered for one table only, so creating jobs for many tables can't flood the scheduler. v1 had the same
 * rule spread over its two modals (`ignoreMinutely` on the multi-table one).
 */
export function allowsMinutely(tableCount: number): boolean {
  return tableCount <= 1;
}

function isMinutely(schedule: JobFormValues['schedule']): boolean {
  return schedule.mode === ScheduleMode.Recurring && schedule.frequency === Frequency.Minutely;
}

/** A generic JDBC source gets a `generic_jdbc_job`, as in v1; the other JDBC types a `jdbc_job`. */
export function jobClassNameFor(source: Pick<JdbcSource, 'databaseType'>): JdbcJobClassName {
  return source.databaseType === JdbcDatabaseType.GenericJdbc ? JobClassName.GenericJdbc : JobClassName.Jdbc;
}

export function newJobFormValues(sourceId: SourceId | undefined, now: number, offsetAt: OffsetAt): JobFormValues {
  return {
    displayName: '',
    sourceId: sourceId ?? null,
    databaseName: '',
    tableNames: [],
    destDatabaseName: '',
    destTableName: '',
    syncMode: SyncMode.FullSync,
    incrementalColumn: '',
    lastSyncedValue: DEFAULT_LAST_SYNCED_VALUE,
    schedule: defaultScheduleFormValues(now, offsetAt)
  };
}

export function jobToFormValues(job: JdbcJob, now: number, offsetAt: OffsetAt): JobFormValues {
  return {
    displayName: job.displayName,
    sourceId: job.sourceId,
    databaseName: job.databaseName,
    tableNames: job.tableName ? [job.tableName] : [],
    destDatabaseName: job.destDatabaseName,
    destTableName: job.destTableName,
    syncMode: job.syncMode,
    incrementalColumn: job.incrementalColumn ?? '',
    lastSyncedValue: job.lastSyncedValue,
    schedule: scheduleToFormValues(job.scheduleTime, now, offsetAt)
  };
}

export function initialJobFormValues(target: JobFormTarget, now: number, offsetAt: OffsetAt): JobFormValues {
  return target.mode === 'edit' ? jobToFormValues(target.job, now, offsetAt) : newJobFormValues(target.source?.id, now, offsetAt);
}

/**
 * The destination table after the source tables change from `previous` to `next`: it follows the source table until
 * the user types another name. With several tables it is not used, so it is left as is.
 */
export function followDestTableName(previous: readonly string[], next: readonly string[], destTableName: string): string {
  const followed = destTableName === '' || destTableName === (previous[0] ?? '');
  return followed && next.length <= 1 ? (next[0] ?? '') : destTableName;
}

/** Suggestions are loaded for a name the server listed, not for every keystroke of a typed one. */
export function isListed(name: string, names: readonly string[] | undefined): boolean {
  return name !== '' && (names?.includes(name) ?? false);
}

/** How a valid form is saved: `job/create`, `job/multi_create` (one job per table) or `PUT job/{id}`. */
export type JobSavePlan =
  | { readonly kind: 'create'; readonly job: JdbcJob }
  | { readonly kind: 'createForTables'; readonly baseJob: JdbcJob; readonly tableNames: readonly string[] }
  | { readonly kind: 'update'; readonly job: JdbcJob };

export interface JobSaveContext {
  readonly target: JobFormTarget;
  /** `class_name` of a new job, from its source (`jobClassNameFor`); an edit keeps the job's. */
  readonly className: JdbcJobClassName;
  readonly now: number;
  readonly offsetAt: OffsetAt;
}

/**
 * Pure: what to send for valid form values. The schedule is converted to the server's format here, in one place (v1
 * converted it in some submit paths only). An edit merges onto the saved job, keeping its status and the JSON fields
 * v2 doesn't edit.
 */
export function planJobSave(values: JobFormValues, { target, className, now, offsetAt }: JobSaveContext): JobSavePlan {
  const tables = cleanTableNames(values.tableNames);
  const incremental = values.syncMode === SyncMode.IncrementalSync;
  const edits: JdbcJobValues = {
    className: target.mode === 'edit' ? target.job.className : className,
    displayName: values.displayName.trim(),
    sourceId: values.sourceId ?? -1,
    syncMode: values.syncMode,
    databaseName: values.databaseName.trim(),
    tableName: tables[0] ?? '',
    destDatabaseName: values.destDatabaseName.trim(),
    destTableName: values.destTableName.trim(),
    incrementalColumn: incremental ? values.incrementalColumn.trim() : undefined,
    lastSyncedValue: values.lastSyncedValue.trim() || DEFAULT_LAST_SYNCED_VALUE,
    scheduleTime: formValuesToSchedule(values.schedule, now, offsetAt)
  };
  if (target.mode === 'edit') return { kind: 'update', job: { ...target.job, ...edits } };
  if (tables.length === 1) return { kind: 'create', job: newJdbcJob(edits) };
  return { kind: 'createForTables', baseJob: newJdbcJob({ ...edits, tableName: '', destTableName: '' }), tableNames: tables };
}

/** The sources the picker offers: the JDBC ones, plus the target's own while the list loads or if it isn't listed. */
export function pickableSources(listed: readonly DataSource[] | undefined, own: JdbcSource | undefined): JdbcSource[] {
  const jdbc = (listed ?? []).filter((source): source is JdbcSource => source.kind === 'jdbc');
  return own && !jdbc.some(source => source.id === own.id) ? [own, ...jdbc] : jdbc;
}

/** The OK button: Update, Create, or how many jobs a multi-table create makes. */
export function saveButtonText(isEdit: boolean, tableCount: number): string {
  if (isEdit) return 'Update';
  return tableCount > 1 ? `Create ${tableCount} jobs` : 'Create';
}

/** The toast after a save. */
export function jobSavedMessage(plan: JobSavePlan): string {
  switch (plan.kind) {
    case 'create':
      return 'Job created';
    case 'createForTables':
      return `${plan.tableNames.length} jobs created`;
    case 'update':
      return 'Job updated';
  }
}
