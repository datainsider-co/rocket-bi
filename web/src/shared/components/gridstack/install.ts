/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 2:09 PM
 */

import _Vue from 'vue';
import DiGridstack from '@/shared/components/gridstack/DiGridstack.vue';
import DiGridstackItem from '@/shared/components/gridstack/DiGridstackItem.vue';

const GridStackComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('DiGridstack', DiGridstack);
    Vue.component('DiGridstackItem', DiGridstackItem);
  }
};
export default GridStackComponents;
