import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import { RelationshipService } from '@/core/relationship/RelationshipService';
import { SchemaService } from '@/core/schema/SchemaService';
import { relationshipKeys, relationshipQueryOptions } from './relationshipQueries';

/** The dashboard's relationships with the schema of every table in them. */
export function useRelationshipData(dashboardId: number) {
  const relationships = useDi(RelationshipService);
  const schema = useDi(SchemaService);
  return useQuery(relationshipQueryOptions(relationships, schema, dashboardId));
}

export function useSaveRelationship(dashboardId: number) {
  const relationships = useDi(RelationshipService);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (info: RelationshipInfo) => relationships.saveDashboardRelationship(dashboardId, info),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
  });
}
