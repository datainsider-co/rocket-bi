import Vue, { PluginObject } from 'vue';
import LoadingDirective from '@/shared/directives/Loading/Loading.directive';

type DirectiveOptions = {};

const Directives: PluginObject<DirectiveOptions> = {
  install(vm: typeof Vue) {
    vm.directive('loading', LoadingDirective);
  }
};

export default Directives;
