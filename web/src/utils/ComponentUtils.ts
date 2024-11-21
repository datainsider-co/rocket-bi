import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import Vue from 'vue';

export abstract class ComponentUtils {
  static registerComponentsAsGlobal(requireComponents: __WebpackModuleApi.RequireContext): void {
    requireComponents.keys().forEach(fileName => {
      if (fileName.endsWith('.vue')) {
        const componentConfig = requireComponents(fileName);

        const componentName = upperFirst(camelCase(fileName.replace(/^\.\/(.*)\.\w+$/, '$1')));
        Vue.component(componentName, componentConfig.default || componentConfig);
      }
    });
  }
}
