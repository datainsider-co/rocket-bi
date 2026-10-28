import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { ApiError, ApiErrorReason } from '@/shared/http/ApiError';
import type { Connection } from './Connection';
import { parseConnection } from './Connection';
import { RefreshSchemaHistory } from './RefreshSchemaHistory';

/**
 * The organization's single data warehouse connection. Everything but `exists` and `get` needs the
 * `organization:manage:connection` permission.
 */
export interface ConnectionService {
  exists(): Promise<boolean>;
  /** `undefined` when the saved connection is a type v2 can't handle yet. Fails with 404 when there is none. */
  get(): Promise<Connection | undefined>;
  /**
   * The saved connection's `class_name`, also for the types v2 can't set up (`bigquery_connection`, ...): what SQL
   * dialect the formulas are written in. Fails with 404 when there is none.
   */
  getSourceType(): Promise<string>;
  save(connection: Connection): Promise<void>;
  /** Resolves when the server can connect; fails with the driver's message otherwise. */
  test(connection: Connection): Promise<void>;
  /** Starts a schema refresh in the background. Does nothing when one is already running. */
  refreshSchema(): Promise<void>;
  getRefreshHistory(): Promise<RefreshSchemaHistory>;
  /** Public key the SSH host must trust. Generates the organization's key pair on first use. */
  getSshPublicKey(): Promise<string>;
}

export const ConnectionService = token<ConnectionService>('ConnectionService');

type Json = Record<string, unknown>;

function asJson(value: unknown): Json {
  return typeof value === 'object' && value !== null ? (value as Json) : {};
}

/** Paths and field names are the backend's (`ConnectionController`, Jackson SNAKE_CASE). */
export class HttpConnectionService implements ConnectionService {
  constructor(private readonly http: KyInstance) {}

  async exists(): Promise<boolean> {
    const json = asJson(await this.http.get('connection/exist').json());
    return json.existed === true;
  }

  async get(): Promise<Connection | undefined> {
    return parseConnection(await this.http.get('connection').json());
  }

  async getSourceType(): Promise<string> {
    const className = asJson(await this.http.get('connection').json()).class_name;
    return typeof className === 'string' ? className : '';
  }

  async save(connection: Connection): Promise<void> {
    await this.http.post('connection', { json: { source: connection.toJson() } });
  }

  async test(connection: Connection): Promise<void> {
    const json = asJson(await this.http.post('connection/test', { json: { source: connection.toJson() } }).json());
    // A failed test comes back as a 500 with the driver's message; `success: false` is not expected but kept safe.
    if (json.success !== true) {
      throw new ApiError('Cannot connect to the data source', 400, ApiErrorReason.unknown);
    }
  }

  async refreshSchema(): Promise<void> {
    await this.http.post('connection/refresh-schema');
  }

  async getRefreshHistory(): Promise<RefreshSchemaHistory> {
    return new RefreshSchemaHistory(await this.http.get('connection/refresh-schema/status').json());
  }

  async getSshPublicKey(): Promise<string> {
    const existing = await this.readSshPublicKey();
    if (existing) return existing;
    await this.http.post('connection/ssh/generate-key');
    const generated = await this.readSshPublicKey();
    if (!generated) {
      throw new ApiError('Cannot create the SSH key', 500, ApiErrorReason.unknown);
    }
    return generated;
  }

  private async readSshPublicKey(): Promise<string | undefined> {
    const json = asJson(await this.http.get('connection/ssh/public-key').json());
    return json.is_exists === true && typeof json.public_key === 'string' ? json.public_key : undefined;
  }
}
