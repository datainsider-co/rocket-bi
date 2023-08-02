/*
 * @author: tvc12 - Thien Vi
 * @created: 7/1/21, 10:51 AM
 */

import Vue from 'vue';

const CommonComponentPlugin = Object.freeze({
  install(vue: typeof Vue) {
    vue.component('DiDropdown', () => import('./di-dropdown/DiDropdown.vue'));
    vue.component('DiDropdownV2', () => import('./di-dropdown-v2/DiDropdownV2.vue'));
    vue.component('DiSlider', () => import('./di-slider/DiSlider.vue'));
    vue.component('DiTable', () => import('./di-table/DiTable.vue'));
    vue.component('DiInput', () => import('./DiInput.vue'));
    vue.component('NavigationPanel', () => import('./NavigationPanel.vue'));
    vue.component('DiShareModal', () => import('./di-share-modal/DiShareModal.vue'));
    vue.component('DiButton', () => import('./DiButton.vue'));
    vue.component('DiIconTextButton', () => import('./DiIconTextButton.vue'));
    vue.component('DiShadowButton', () => import('./DiShadowButton.vue'));
    vue.component('DateRangeDropdown', () => import('./DateRangeDropdown.vue'));
    vue.component('DiToggle', () => import('./DiToggle.vue'));
    vue.component('DiMultiChoice', () => import('./DiMultiChoice.vue'));
    vue.component('DiInputComponent2', () => import('@/screens/login-v2/components/DiInputComponent2.vue'));
  }
});

export default CommonComponentPlugin;
