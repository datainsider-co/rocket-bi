import _Vue from 'vue';
import Modal from '@/shared/components/builder/Modal.vue';
import ChartComponents from '@chart/index';

export { Modal };

const DataComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('Modal', Modal);
    Vue.use(ChartComponents);
  }
};
export default DataComponents;
