import { getModule, Module, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.LakeHouse })
class LakeHouseStore extends VuexModule {}

export const LakeHouseModule = getModule(LakeHouseStore);
