import './assets/style.css';
// @ts-ignored
import { config, updateConfig } from './services/Common';
import { Log } from '@core/utils';
import _Vue from 'vue';

export default Object.freeze({
  install(vm: typeof _Vue, settings: any) {
    updateConfig(settings);
    Log.debug('install', settings);
    vm.component(config.componentName, () => import('./components/upload-document/UploadDocument.vue'));
  }
});
