import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DashboardService, DataManager, PermissionTokenService } from '@core/services';
import { PermissionService } from '@core/services/permission.service';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { CheckActionPermittedRequest } from '@core/domain/Request/ShareRequest';
import { ShareService } from '@core/share/service/share_service';
import { ResourceType } from '@/utils/permission_utils';
import { Dashboard } from '@core/domain/Model';
import { Log } from '@core/utils';
import { DI } from '@core/modules';

@Module({ store, name: Stores.permissionHandler, dynamic: true, namespaced: true })
export class PermissionHandler extends VuexModule {
  token: string | null = null;
  actionsFromToken: string[] = [];
  actionsFromUser: string[] = [];
  private dataManager = DI.get(DataManager);

  @Inject
  private permissionTokenService!: PermissionTokenService;

  @Inject
  private permissionService!: PermissionService;

  @Inject
  private shareService!: ShareService;

  @Inject dashboardService!: DashboardService;

  @Mutation
  clearTokenData() {
    this.token = null;
    this.actionsFromToken = [];
  }

  @Mutation
  reset() {
    this.token = null;
    this.actionsFromToken = [];
    this.actionsFromUser = [];
  }

  @Action
  async getActionsFromToken(payload: { token?: string | null; resourceType: ResourceType; resourceId: string; actions: string[] }): Promise<string[]> {
    if (payload.token) {
      return this.permissionTokenService
        .isPermittedForToken({ tokenId: payload.token, resourceType: payload.resourceType, resourceId: payload.resourceId, actions: payload.actions })
        .then(resp => {
          const result: string[] = [];
          for (const key of resp.keys()) {
            if (resp.get(key)) {
              result.push(key);
            }
          }
          return result;
        });
    } else {
      return Promise.resolve([]);
    }
  }

  @Action
  getActionsFromSession(payload: { session?: string | null; resourceType: ResourceType; resourceId: string; actions: string[] }): Promise<string[]> {
    const result: string[] = [];
    if (payload.session) {
      const request: CheckActionPermittedRequest = { resourceType: payload.resourceType, resourceId: payload.resourceId, actions: payload.actions };
      return this.shareService.isPermittedForUser(request).then(resp => {
        for (const key of resp.keys()) {
          if (resp.get(key)) {
            result.push(key);
          }
        }
        return result;
      });
    } else {
      return Promise.resolve([]);
    }
  }

  @Action
  async loadPermittedActions(payload: {
    token?: string | null;
    session?: string | null;
    resourceType: ResourceType;
    resourceId: string;
    actions: string[];
  }): Promise<void> {
    const { token, session, resourceType, resourceId, actions } = payload;
    const [actionsFromToken, actionsFromUser] = await Promise.all([
      this.getActionsFromToken({ token: token, resourceType: resourceType, resourceId: resourceId, actions: actions }),
      this.getActionsFromSession({ session: session, resourceType: resourceType, resourceId: resourceId, actions: actions })
    ]);
    Log.debug('PermissionFromToken::', actionsFromToken, 'UserPermission::', actionsFromUser);
    this.setCurrentActionData({
      token: token,
      actionsFromUser: actionsFromUser,
      actionsFromToken: actionsFromToken
    });
  }

  @Mutation
  setCurrentActionData(payload: { token?: string | null; actionsFromToken?: string[]; actionsFromUser?: string[] }) {
    const { token, actionsFromToken, actionsFromUser } = payload;
    if (token) {
      this.token = token;
    }
    if (actionsFromToken) {
      this.actionsFromToken = actionsFromToken;
    }
    if (actionsFromUser) {
      this.actionsFromUser = actionsFromUser;
    }
  }

  get allActions(): Set<string> {
    return new Set<string>([...this.actionsFromToken, ...this.actionsFromUser]);
  }
}
export const PermissionHandlerModule: PermissionHandler = getModule(PermissionHandler);
