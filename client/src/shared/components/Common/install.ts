/*
 * @author: tvc12 - Thien Vi
 * @created: 7/1/21, 10:51 AM
 */

import Vue from 'vue';

const CommonComponentPlugin = Object.freeze({
  install(vue: typeof Vue) {
    vue.component('DiDropdown', () => import('./DiDropdown/DiDropdown.vue'));
    vue.component('DiSlider', () => import('./DiSlider/DiSlider.vue'));
    vue.component('DiTable', () => import('./DiTable/DiTable.vue'));
    vue.component('DiInput', () => import('./DiInput.vue'));
    vue.component('NavigationPanel', () => import('./NavigationPanel.vue'));
    vue.component('DiShareModal', () => import('./DiShareModal/DiShareModal.vue'));
    vue.component('DiButton', () => import('./DiButton.vue'));
    vue.component('DiIconTextButton', () => import('./DiIconTextButton.vue'));
    vue.component('DiShadowButton', () => import('./DiShadowButton.vue'));
    vue.component('DateRangeDropdown', () => import('./DateRangeDropdown.vue'));
    vue.component('DiToggle', () => import('./DiToggle.vue'));
    vue.component('DiMultiChoice', () => import('./DiMultiChoice.vue'));
  }
});

export default CommonComponentPlugin;
