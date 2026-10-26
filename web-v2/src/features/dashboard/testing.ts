import { vi } from 'vitest';
import { asRecord, asString } from '@/core/json/json';
import type { QueryService } from '@/core/query/QueryService';
import { visualizationResponseFromJson } from '@/core/query/VisualizationResponse';
import responses from '@/core/query/queryResponses.fixture.json';

/**
 * Test-only: answers `chart/query` with the local backend's reply for the request's setting class (see
 * `queryResponses.fixture.json`), or rejects for classes it has none for.
 */
export function fakeQueryService(overrides: Partial<QueryService> = {}): QueryService {
  return {
    query: vi.fn<QueryService['query']>(async request => {
      const className = asString(asRecord(request['query_setting'])['class_name']);
      const json = (responses as Record<string, unknown>)[className];
      if (!json) throw new Error(`no fixture for ${className}`);
      return visualizationResponseFromJson(json);
    }),
    ...overrides
  };
}
