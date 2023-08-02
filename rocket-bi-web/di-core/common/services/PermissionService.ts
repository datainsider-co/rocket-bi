import { PermissionRepository } from '../repositories/PermissionRepository';
import { Inject } from 'typescript-ioc';

export abstract class PermissionService {
  abstract getUserPermissions(): Promise<string[]>;
}

export class PermissionServiceImpl implements PermissionService {
  constructor(@Inject private repository: PermissionRepository) {}

  getUserPermissions(): Promise<string[]> {
    return this.repository.getUserPermissions();
  }
}
