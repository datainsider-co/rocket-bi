import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { HttpRelationshipService, RelationshipService } from './RelationshipService';

export const RelationshipModule: DiModule = di => {
  di.bindSingleton(RelationshipService, d => new HttpRelationshipService(d.get(ApiClient)));
};
