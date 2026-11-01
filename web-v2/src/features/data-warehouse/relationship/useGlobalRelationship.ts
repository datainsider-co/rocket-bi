import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { RelationshipInfo } from '@/core/relationship/RelationshipInfo';
import { RelationshipService } from '@/core/relationship/RelationshipService';
import { SchemaService } from '@/core/schema/SchemaService';
import { loadRelationshipData, RELATIONSHIP_QUERY_DEFAULTS, relationshipKeys } from '@/shared/relationship/relationshipData';

export function globalRelationshipQueryOptions(relationships: RelationshipService, schema: SchemaService) {
  return queryOptions({
    queryKey: relationshipKeys.global,
    queryFn: () => loadRelationshipData(() => relationships.getGlobalRelationship(), schema),
    ...RELATIONSHIP_QUERY_DEFAULTS
  });
}

/** The global relationships (`GET relationships/global`) with the columns of every table in them. */
export function useGlobalRelationship() {
  return useQuery(globalRelationshipQueryOptions(useDi(RelationshipService), useDi(SchemaService)));
}

/**
 * `POST relationships/global`. Every relationship query goes stale (a dashboard without its own shows the global
 * ones) but none is refetched: the open editor keeps what it saved, a reload would reset its canvas.
 */
export function useSaveGlobalRelationship() {
  const relationships = useDi(RelationshipService);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (info: RelationshipInfo) => relationships.saveGlobalRelationship(info),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: relationshipKeys.all, refetchType: 'none' })
  });
}
