import '../di-upload-document/assets/style.css';
// @ts-ignore
import Swal from 'sweetalert2';
// @ts-ignored
import { config, updateConfig } from '@/screens/data-ingestion/components/di-upload-document/services/Common';
import { Log } from '@core/utils';
import _Vue from 'vue';

export default Object.freeze({
  install(vm: typeof _Vue, settings: any) {
    updateConfig(settings);
    Log.debug('install', settings);
    vm.component(config.componentName, () => import('./components/google-sheet-modal/GoogleSheetModal.vue'));
    vm.prototype.$alert = Swal;
  }
});
