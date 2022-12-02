import Vue from 'vue';
import Vuex from 'vuex';
import { config } from 'vuex-module-decorators';

// Set rawError to true by default on all @Action decorators
config.rawError = true;
Vue.use(Vuex);

const isDebugMode = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({ strict: isDebugMode });

export const commonStore = new Vuex.Store({ strict: isDebugMode });
