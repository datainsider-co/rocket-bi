/*
 * @author: tvc12 - Thien Vi
 * @created: 12/7/20, 1:21 PM
 */

import _Vue from 'vue';

import ColorInputComponent from './ColorInputComponent.vue';
import InputConfigComponent from './InputConfigComponent.vue';
import SelectConfigComponent from './SelectConfigComponent.vue';
import ToggleInputConfigComponent from './ToggleInputConfigComponent.vue';
import ToggleSettingComponent from './ToggleSettingComponent.vue';
import GroupSettingComponent from '@/shared/components/builder/setting/GroupSettingComponent.vue';
import TextEditorComponent from '@/shared/components/builder/setting/TextEditorComponent.vue';
import AlignComponent from '@/shared/components/builder/setting/AlignComponent.vue';

// const CodeInputComponent = () => import('./CodeInputComponent.vue');

const SettingComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('ColorInputComponent', ColorInputComponent);
    Vue.component('InputConfigComponent', InputConfigComponent);
    Vue.component('SelectConfigComponent', SelectConfigComponent);
    Vue.component('ToggleInputConfigComponent', ToggleInputConfigComponent);
    Vue.component('ToggleSettingComponent', ToggleSettingComponent);
    // Vue.component('CodeInputComponent', CodeInputComponent);
    Vue.component('GroupSettingComponent', GroupSettingComponent);
    Vue.component('TextEditorComponent', TextEditorComponent);
    Vue.component('AlignComponent', AlignComponent);
  }
};

export default SettingComponents;
