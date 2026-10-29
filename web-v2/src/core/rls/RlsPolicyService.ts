import type { KyInstance } from 'ky';
import { token, type DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { asArray, asRecord } from '@/core/json/json';
import type { TableRef } from '@/core/schema/SchemaEditService';
import { rlsPolicyFromJson, rlsPolicyToJson, type RlsPolicy } from './RlsPolicy';

/** A table's row level security policies (v1 `RlsRepository`). Reading needs `rls:view:*`, saving `rls:edit:*`. */
export interface RlsPolicyService {
  list(table: TableRef, signal?: AbortSignal): Promise<RlsPolicy[]>;
  /**
   * Replaces the table's policies with these: saved ones keep their id, new ones get one, the others are deleted.
   * Answers with the table's policies as saved.
   */
  put(table: TableRef, policies: readonly RlsPolicy[]): Promise<RlsPolicy[]>;
}

export const RlsPolicyService = token<RlsPolicyService>('RlsPolicyService');

function policiesFromJson(value: unknown): RlsPolicy[] {
  return asArray(asRecord(value)['data']).map(rlsPolicyFromJson);
}

/** Paths and bodies are the backend's (`RlsPolicyController`), checked on the local stack (DW0). */
export class HttpRlsPolicyService implements RlsPolicyService {
  constructor(private readonly http: KyInstance) {}

  async list(table: TableRef, signal?: AbortSignal): Promise<RlsPolicy[]> {
    const json = await this.http.post('policies/list', { json: { db_name: table.dbName, tbl_name: table.name }, signal }).json();
    return policiesFromJson(json);
  }

  async put(table: TableRef, policies: readonly RlsPolicy[]): Promise<RlsPolicy[]> {
    const body = { db_name: table.dbName, tbl_name: table.name, policies: policies.map(policy => rlsPolicyToJson(policy, table)) };
    return policiesFromJson(await this.http.put('policies', { json: body }).json());
  }
}

export const RlsModule: DiModule = di => {
  di.bindSingleton(RlsPolicyService, d => new HttpRlsPolicyService(d.get(ApiClient)));
};
