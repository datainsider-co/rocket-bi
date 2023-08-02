import Modal from './Modal.vue';
import _Vue from 'vue';
import SettingComponents from '@/shared/components/builder/setting';
import ChartComponents from '@chart/index';

export { Modal };

const BuilderComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('Modal', Modal);
    Vue.use(SettingComponents);
    Vue.use(ChartComponents);
  }
};
export default BuilderComponents;
