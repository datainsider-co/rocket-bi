import { DashboardMode, isEdit, isFullScreen, isTVMode, Stores } from '@/shared';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { ActionType } from '@/utils/permission_utils';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.dashboardModeStore })
export class DashboardModeStore extends VuexModule {
  mode: DashboardMode = DashboardMode.View;
  actionTypes: Set<ActionType> = new Set();

  get isFullScreen() {
    return isFullScreen(this.mode);
  }

  get isTVMode() {
    return isTVMode(this.mode);
  }

  get isEditMode() {
    return isEdit(this.mode);
  }

  get isViewMode() {
    return this.mode == DashboardMode.View;
  }

  @Mutation
  setMode(newMode: DashboardMode) {
    this.mode = newMode;
  }

  @Mutation
  setActions(actions: Set<ActionType>) {
    this.actionTypes = actions;
  }

  @Mutation
  reset() {
    this.mode = DashboardMode.View;
  }

  @Action
  async handleActionChange(actions: Set<ActionType>): Promise<void> {
    this.setActions(actions);
    // reset mode
    this.setMode(DashboardMode.View);
  }

  get canEdit(): boolean {
    return this.actionTypes.has(ActionType.edit) || this.actionTypes.has(ActionType.all);
  }

  get canDuplicate(): boolean {
    return this.actionTypes.has(ActionType.copy) || this.actionTypes.has(ActionType.all);
  }

  get canDelete(): boolean {
    return this.actionTypes.has(ActionType.delete) || this.actionTypes.has(ActionType.all);
  }
}

export const DashboardModeModule: DashboardModeStore = getModule(DashboardModeStore);
