import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asArray, asNumber, asRecord, asString, isRecord } from '@/core/json/json';
import { UserProfile } from '@/core/user/UserProfile';
import type { DatabaseInfo } from './SchemaService';

/**
 * Databases of the warehouse, as the Data Warehouse listing shows and changes them (v1 `SchemaRepository`). There is no
 * trash: the server's `remove` and `restore` do nothing and `databases/trash` is always empty (`DATA_WAREHOUSE.md`,
 * DW0), so deleting drops the database.
 */

/** A row of `databases/my_data` (backend `ShortSchemaInfo`). */
export interface DatabaseEntry {
  readonly name: string;
  readonly displayName: string;
  readonly creatorId: string;
  /** Epoch millis. */
  readonly createdTime: number;
  readonly updatedTime: number;
  /** Only when the creator is a user of the organization; databases already in the warehouse have none. */
  readonly owner: UserProfile | undefined;
}

export function databaseEntryFromJson(value: unknown): DatabaseEntry {
  const json = asRecord(value);
  const database = asRecord(json['database']);
  const name = asString(database['name']);
  return {
    name,
    displayName: asString(database['display_name']) || name,
    creatorId: asString(database['creator_id']),
    createdTime: asNumber(database['created_time']),
    updatedTime: asNumber(database['updated_time']),
    owner: isRecord(json['owner']) ? new UserProfile(json['owner']) : undefined
  };
}

export interface DatabaseService {
  /** Every database the user can read. The server ignores `from` and `size`, so there is one page. */
  listMyData(signal?: AbortSignal): Promise<DatabaseEntry[]>;
  /**
   * `name` must be word characters (`\w+`, checked by the server). MySQL storage doesn't keep `displayName`: the
   * database comes back with its name as display name.
   */
  create(name: string, displayName: string): Promise<DatabaseInfo>;
  /** Drops the database and its tables. */
  delete(dbName: string): Promise<void>;
}

export const DatabaseService = token<DatabaseService>('DatabaseService');

/** Paths and bodies are the backend's (`SchemaController`), checked on the local stack (DW0). */
export class HttpDatabaseService implements DatabaseService {
  constructor(private readonly http: KyInstance) {}

  async listMyData(signal?: AbortSignal): Promise<DatabaseEntry[]> {
    const json = asRecord(await this.http.get('databases/my_data', { signal }).json());
    return asArray(json['data']).map(databaseEntryFromJson);
  }

  async create(name: string, displayName: string): Promise<DatabaseInfo> {
    const json = asRecord(await this.http.post('databases', { json: { name, display_name: displayName } }).json());
    const created = asString(json['name']);
    return { name: created, displayName: asString(json['display_name']) || created };
  }

  async delete(dbName: string): Promise<void> {
    await this.http.delete(`databases/${encodeURIComponent(dbName)}`);
  }
}
