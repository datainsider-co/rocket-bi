import type { DiModule } from '@/core/di/Container';
import { AuthModule } from '@/core/auth/AuthModule';
import { ConnectionModule } from '@/core/connection/ConnectionModule';
import { DashboardModule } from '@/core/dashboard/DashboardModule';
import { DirectoryModule } from '@/core/directory/DirectoryModule';
import { PermissionModule } from '@/core/permission/PermissionModule';
import { QueryModule } from '@/core/query/QueryService';
import { RelationshipModule } from '@/core/relationship/RelationshipModule';
import { SchemaEditModule } from '@/core/schema/SchemaEditService';
import { SchemaModule } from '@/core/schema/SchemaService';
import { ShareModule } from '@/core/share/ShareModule';
import { UserModule } from '@/core/user/UserService';
import { HttpModule } from './HttpModule';

/** Bound in order when the app starts, like v1's `Di.init([...])`. Feature modules go after `HttpModule`. */
export const appModules: readonly DiModule[] = [
  HttpModule,
  AuthModule,
  PermissionModule,
  ConnectionModule,
  DirectoryModule,
  DashboardModule,
  QueryModule,
  SchemaModule,
  SchemaEditModule,
  RelationshipModule,
  UserModule,
  ShareModule
];
