import '../DiUploadDocument/assets/style.css';
// @ts-ignore
import Swal from 'sweetalert2';
// @ts-ignored
import { config, updateConfig } from '@/screens/DataIngestion/components/DiUploadDocument/services/Common';
import { Log } from '@core/utils';
import _Vue from 'vue';

export default Object.freeze({
  install(vm: typeof _Vue, settings: any) {
    updateConfig(settings);
    Log.debug('install', settings);
    vm.component(config.componentName, () => import('./components/GoogleSheetModal/GoogleSheetModal.vue'));
    vm.prototype.$alert = Swal;
  }
});
