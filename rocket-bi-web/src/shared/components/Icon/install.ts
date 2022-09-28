/*
/*
 * @author: tvc12 - Thien Vi
 * @created: 7/12/21, 5:28 PM
 */

import Vue from 'vue';

const DiIcons = Object.freeze({
  install(vue: typeof Vue) {
    vue.component('DeactivateSingleChoiceIcon', () => import('./DeactivateSingleChoiceIcon.vue'));
    vue.component('ActiveSingleChoiceIcon', () => import('./ActiveSingleChoiceIcon.vue'));
    vue.component('ActiveMultiChoiceIcon', () => import('./ActiveMultiChoiceIcon.vue'));
    vue.component('DeactivateMultiChoiceIcon', () => import('./DeactivateMultiChoiceIcon.vue'));
    vue.component('AddIcon', () => import('./AddIcon.vue'));
    vue.component('DirectoryIcon', () => import('./DirectoryIcon.vue'));
    vue.component('DashboardIcon', () => import('./DashboardIcon.vue'));
    vue.component('DataWarehouseIcon', () => import('./DataWarehouseIcon.vue'));
    vue.component('DatabaseIcon', () => import('./DatabaseIcon.vue'));
    vue.component('DashboardSettingIcon', () => import('./DashboardSettingIcon.vue'));
    vue.component('CustomerSettingIcon', () => import('./CustomerSettingIcon.vue'));
    vue.component('SettingIcon', () => import('./SettingIcon.vue'));
    vue.component('DataSourceIcon', () => import('./DataSourceIcon.vue'));
    vue.component('JobIcon', () => import('./JobIcon.vue'));
    vue.component('JobHistoryIcon', () => import('./JobHistoryIcon.vue'));
    vue.component('BackIcon', () => import('./BackIcon.vue'));
    vue.component('RightIcon', () => import('./RightIcon.vue'));
    vue.component('DataDateIcon', () => import('./DataDateIcon.vue'));
    vue.component('DynamicFunctionIcon', () => import('./DynamicFunctionIcon.vue'));
    vue.component('DataNumberIcon', () => import('./DataNumberIcon.vue'));
    vue.component('DataTextIcon', () => import('./DataTextIcon.vue'));
    vue.component('FunctionIcon', () => import('./FunctionIcon.vue'));
    vue.component('CloseIcon', () => import('./CloseIcon.vue'));
    vue.component('BreadcrumbIcon', () => import('./BreadcrumbIcon.vue'));
    vue.component('AddUserIcon', () => import('./AddUserIcon.vue'));
    vue.component('LinkIcon', () => import('./LinkIcon.vue'));
    vue.component('EmptyDataIcon', () => import('./EmptyDataIcon.vue'));
    vue.component('DownIcon', () => import('./DownIcon.vue'));
    vue.component('DragIcon', () => import('./DragIcon.vue'));
    vue.component('SearchIcon', () => import('./SearchIcon.vue'));
  }
});

export default DiIcons;
