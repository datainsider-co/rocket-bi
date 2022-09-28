import { getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '../index';

export interface LoaderState {
  loading: number;
}

@Module({ store, name: 'loaderStore', dynamic: true, namespaced: true })
export default class LoaderStore extends VuexModule {
  public loading: LoaderState['loading'] = 0;

  get getLoading() {
    return this.loading;
  }

  @Mutation
  public startLoading(): void {
    this.loading++;
  }

  @Mutation
  public finishLoading(): void {
    this.loading--;
  }
}
export const LoaderModule: LoaderStore = getModule(LoaderStore);
