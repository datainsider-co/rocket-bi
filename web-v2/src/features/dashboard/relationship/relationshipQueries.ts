import { queryOptions } from '@tanstack/react-query';
import type { RelationshipService } from '@/core/relationship/RelationshipService';
import type { SchemaService } from '@/core/schema/SchemaService';
import { loadRelationshipData, RELATIONSHIP_QUERY_DEFAULTS, relationshipKeys } from '@/shared/relationship/relationshipData';

/** The dashboard's relationships with the schema of every table in them. */
export function relationshipQueryOptions(relationships: RelationshipService, schema: SchemaService, dashboardId: number) {
  return queryOptions({
    queryKey: relationshipKeys.dashboard(dashboardId),
    queryFn: () => loadRelationshipData(() => relationships.getDashboardRelationship(dashboardId), schema),
    ...RELATIONSHIP_QUERY_DEFAULTS
  });
}
