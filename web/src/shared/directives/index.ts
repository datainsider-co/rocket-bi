import Vue, { PluginObject } from 'vue';
import LoadingDirective from '@/shared/directives/loading/LoadingDirective';
import './swal-alert/swal.css';
// @ts-ignore
import Swal from 'sweetalert2';

type DirectiveOptions = {};

const Directives: PluginObject<DirectiveOptions> = {
  install(vm: typeof Vue) {
    vm.directive('loading', LoadingDirective);
    vm.prototype.$alert = Swal;
  }
};

export default Directives;
