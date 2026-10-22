import type { RefreshSchemaHistory, RefreshSchemaStage } from '@/core/connection/RefreshSchemaHistory';
import { RefreshSchemaStageName, StageStatus } from '@/core/connection/RefreshSchemaHistory';

export type StageItemStatus = 'pending' | 'running' | 'success' | 'error';

export interface StageItem {
  name: RefreshSchemaStageName;
  label: string;
  status: StageItemStatus;
  /** "2/5" while a stage with a known total runs. */
  progressText?: string | undefined;
}

export type RefreshOutcome =
  | { kind: 'running' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }
  | { kind: 'terminated' };

const STAGE_NAMES = [
  RefreshSchemaStageName.TestConnection,
  RefreshSchemaStageName.ScanDatabase,
  RefreshSchemaStageName.Completed
] as const;

const DEFAULT_ERROR = 'Cannot fetch the schema.';

/**
 * Starting a refresh only schedules it, so the first polls can still return the previous run. A history is the
 * current run unless it is the same finished run that was there before starting.
 */
export function isCurrentRun(history: RefreshSchemaHistory, before: RefreshSchemaHistory | undefined): boolean {
  return !(before && history.id === before.id && !before.isRunning);
}

/** Polling stops once the current run has finished. */
export function isRefreshDone(history: RefreshSchemaHistory | undefined, before: RefreshSchemaHistory | undefined) {
  return !!history && isCurrentRun(history, before) && !history.isRunning;
}

/** The current run, or `undefined` while it hasn't shown up yet. */
function currentRun(history: RefreshSchemaHistory | undefined, before: RefreshSchemaHistory | undefined) {
  return history && isCurrentRun(history, before) ? history : undefined;
}

export function stageLabel(name: RefreshSchemaStageName, displayName: string): string {
  switch (name) {
    case RefreshSchemaStageName.TestConnection:
      return `Connect to your ${displayName} database.`;
    case RefreshSchemaStageName.ScanDatabase:
      return `Fetch ${displayName} schema into Data Warehouse.`;
    case RefreshSchemaStageName.Completed:
      return 'Finish up.';
  }
}

function toItemStatus(stage: RefreshSchemaStage | undefined, runFailed: boolean): StageItemStatus {
  switch (stage?.status) {
    case StageStatus.Success:
      return 'success';
    case StageStatus.Error:
    case StageStatus.Terminated:
      return 'error';
    case StageStatus.Running:
      return runFailed ? 'error' : 'running';
    default:
      return 'pending';
  }
}

/**
 * The three fixed steps of a refresh. Each takes the status the server reported for it; while the run goes on and
 * no step is reported as running, the first pending one shows as running so there is always visible progress.
 */
export function toStageItems(
  history: RefreshSchemaHistory | undefined,
  before: RefreshSchemaHistory | undefined,
  displayName: string
): StageItem[] {
  const run = currentRun(history, before);
  const isRunning = !run || run.isRunning || run.status === StageStatus.NotStarted;
  const items = STAGE_NAMES.map((name): StageItem => {
    const stage = run?.stages.find(s => s.name === name);
    const status = toItemStatus(stage, !!run && !isRunning);
    const progressText = status === 'running' && stage && stage.total > 0 ? `${stage.progress}/${stage.total}` : undefined;
    return { name, label: stageLabel(name, displayName), status, progressText };
  });

  const firstPending = items.findIndex(item => item.status === 'pending');
  if (isRunning && firstPending >= 0 && !items.some(item => item.status === 'running')) {
    return items.map((item, index) => (index === firstPending ? { ...item, status: 'running' } : item));
  }
  return items;
}

export function toRefreshOutcome(
  history: RefreshSchemaHistory | undefined,
  before: RefreshSchemaHistory | undefined
): RefreshOutcome {
  const run = currentRun(history, before);
  switch (run?.status) {
    case StageStatus.Success:
      return { kind: 'success' };
    case StageStatus.Terminated:
      return { kind: 'terminated' };
    case StageStatus.Error: {
      const failed = run.stages.findLast(stage => stage.status === StageStatus.Error && stage.message);
      return { kind: 'error', message: failed?.message ?? DEFAULT_ERROR };
    }
    default:
      return { kind: 'running' };
  }
}
