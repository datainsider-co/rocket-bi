/*
 * @author: tvc12 - Thien Vi
 * @created: 12/7/20, 1:21 PM
 */

import _Vue from 'vue';

import ToggleSettingComponent from './ToggleSettingComponent.vue';

const SettingComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('ToggleSettingComponent', ToggleSettingComponent);
  }
};

export default SettingComponents;
