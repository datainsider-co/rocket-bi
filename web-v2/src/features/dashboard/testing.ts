import { vi } from 'vitest';
import { asRecord, asString, type JsonObject } from '@/core/json/json';
import { ALL_RESOURCE_ACTIONS, type ResourcePermissionService } from '@/core/permission/ResourcePermissionService';
import type { QueryService } from '@/core/query/QueryService';
import { databaseSchemaFromJson, type SchemaService } from '@/core/schema/SchemaService';
import { UserProfile } from '@/core/user/UserProfile';
import type { UserService } from '@/core/user/UserService';
import schema from '@/core/schema/database.fixture.json';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import responses from '@/core/query/queryResponses.fixture.json';

/**
 * Test-only: answers `chart/query` with the local backend's reply for the request's setting class (see
 * `queryResponses.fixture.json`), or rejects for classes it has none for.
 */
export function fakeQueryService(overrides: Partial<QueryService> = {}): QueryService {
  const answer = async (request: JsonObject) => {
    const className = asString(asRecord(request['query_setting'])['class_name']);
    const json = (responses as Record<string, unknown>)[className];
    if (!json) throw new Error(`no fixture for ${className}`);
    return visualizationResponseFromJson(json);
  };
  return {
    query: vi.fn<QueryService['query']>(answer),
    queryAs: vi.fn<QueryService['queryAs']>(answer),
    export: vi.fn<QueryService['export']>(async () => new Blob(['a,b'])),
    ...overrides
  };
}

/** Test-only: answers every database with the local backend's `sample_v2`. */
export function fakeSchemaService(overrides: Partial<SchemaService> = {}): SchemaService {
  return {
    listDatabases: vi.fn<SchemaService['listDatabases']>(async () => [{ name: 'sample_v2', displayName: 'sample_v2' }]),
    getDatabase: vi.fn<SchemaService['getDatabase']>(async () => databaseSchemaFromJson(schema)),
    detectTableSchema: vi.fn<SchemaService['detectTableSchema']>(async () => ({ dbName: '', name: 'adhoc_view', columns: [] })),
    ...overrides
  };
}

/** Test-only: grants every action on every resource unless overridden. */
export function fakeResourcePermissionService(overrides: Partial<ResourcePermissionService> = {}): ResourcePermissionService {
  return {
    permittedActions: vi.fn<ResourcePermissionService['permittedActions']>(async () => [...ALL_RESOURCE_ACTIONS]),
    ...overrides
  };
}

/** Test-only: the local backend's one user, whatever the keyword. */
export function fakeUserService(overrides: Partial<UserService> = {}): UserService {
  const json = { username: 'root', full_name: 'root', email: 'hello@gmail.com', gender: 0 };
  return {
    suggest: vi.fn<UserService['suggest']>(async () => ({ total: 1, users: [{ profile: new UserProfile(json), json }] })),
    ...overrides
  };
}
