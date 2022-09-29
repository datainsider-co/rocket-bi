/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 5:05 PM
 */

import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { TimeoutUtils } from '@/utils';
import { _ChartStore } from './DataStore';

export interface RenderControllerState {
  widgetIdsNeedRender: number[];
  currentIdRendering: number;
  readyForRequestRender: boolean;
}

@Module({
  dynamic: true,
  namespaced: true,
  store: store,
  name: Stores.renderControllerStore
})
export class RenderControllerStore extends VuexModule {
  private static readonly maxTimeOut = 30000;
  private widgetIdsNeedRender: RenderControllerState['widgetIdsNeedRender'] = [];
  private currentIdRendering: RenderControllerState['currentIdRendering'] = -1;
  private readyForRequestRender: RenderControllerState['readyForRequestRender'] = false;
  private idProcessed: number | undefined | null = null;
  private enable = false;

  @Mutation
  readyRequestRender() {
    this.readyForRequestRender = true;
  }

  @Mutation
  reset() {
    this.widgetIdsNeedRender = [];
    this.currentIdRendering = -1;
    this.readyForRequestRender = false;
  }

  @Mutation
  setCurrentIdRendering(id: number) {
    this.currentIdRendering = id;
  }

  @Action
  async requestRender(id: number): Promise<void> {
    if (this.enable) {
      if (this.readyForRequestRender) {
        this.addIdNeedRender(id);
        if (this.currentIdRendering == -1) {
          this.nextRender();
        }
      }
    } else {
      _ChartStore.setStatusRendered(id);
    }
  }

  @Action
  async completeRender(id: number): Promise<void> {
    if (this.enable) {
      _ChartStore.setStatusRendered(id);
      this.clearTimeoutForRender();
      this.nextRender();
    }
  }

  @Mutation
  private addIdNeedRender(id: number) {
    this.widgetIdsNeedRender.push(id);
  }

  @Mutation
  private nextRender() {
    const id = this.widgetIdsNeedRender.shift();
    if (id) {
      this.currentIdRendering = id;
      _ChartStore.setStatusRendering(id);
      TimeoutUtils.waitAndExec(
        this.idProcessed,
        () => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          RenderControllerModule.completeRender(id);
        },
        5000
      );
    } else {
      this.currentIdRendering = -1;
    }
  }

  @Mutation
  private clearTimeoutForRender() {
    if (this.idProcessed) {
      clearTimeout(this.idProcessed);
    }
  }
}

export const RenderControllerModule: RenderControllerStore = getModule(RenderControllerStore);
