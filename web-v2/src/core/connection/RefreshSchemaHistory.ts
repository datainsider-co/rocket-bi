import Deneric from 'deneric2';

export const StageStatus = {
  Running: 'running',
  Error: 'error',
  Success: 'success',
  NotStarted: 'not_started',
  Terminated: 'terminated'
} as const;

export type StageStatus = (typeof StageStatus)[keyof typeof StageStatus];

export const RefreshSchemaStageName = {
  TestConnection: 'test_connection',
  ScanDatabase: 'scan_database',
  Completed: 'completed'
} as const;

export type RefreshSchemaStageName = (typeof RefreshSchemaStageName)[keyof typeof RefreshSchemaStageName];

/** One step of a schema refresh; backend `RefreshSchemaStage`. `total` is -1 or 0 while unknown. */
export class RefreshSchemaStage extends Deneric {
  name = '';
  progress = 0;
  total = 0;
  status = '';
  message = '';
  createdTime = 0;

  constructor(json?: unknown) {
    super({
      name: ['name', String],
      progress: ['progress', Number],
      total: ['total', Number],
      status: ['status', String],
      message: ['message', String],
      createdTime: ['created_time', Number]
    });
    this.fromJson(json);
  }
}

/**
 * The latest schema refresh of the organization (`GET connection/refresh-schema/status`). With no refresh yet the
 * server answers `id: -1`, `status: not_started`, `is_first_run: true`. `is_first_run` is true only for the very
 * first refresh the organization ever ran.
 */
export class RefreshSchemaHistory extends Deneric {
  id = -1;
  isFirstRun = false;
  status = '';
  stages: RefreshSchemaStage[] = [];
  createdTime = 0;
  updatedTime = 0;

  constructor(json?: unknown) {
    super({
      id: ['id', Number],
      isFirstRun: ['is_first_run', Boolean],
      status: ['status', String],
      stages: ['stages', Deneric.Array(RefreshSchemaStage)],
      createdTime: ['created_time', Number],
      updatedTime: ['updated_time', Number]
    });
    this.fromJson(json);
  }

  get isRunning(): boolean {
    return this.status === StageStatus.Running;
  }

  get isError(): boolean {
    return this.status === StageStatus.Error;
  }

  get isSuccess(): boolean {
    return this.status === StageStatus.Success;
  }
}
