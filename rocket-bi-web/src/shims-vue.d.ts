declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
declare module 'v-click-outside';
declare module 'nprogress';
declare module 'vue2-highcharts';
declare module 'vue2-transitions';
declare module 'v-calendar';
declare module 'vue-click-outside';
declare module 'vue-select';
declare module 'vue-draggable-resizable';
declare module 'ant-design-vue/lib/table';
declare module 'ant-design-vue/lib/tabs';
declare module 'monaco-editor-vue' {
  import Vue from 'vue';
  import { Prop } from 'vue-property-decorator';

  const noop;

  class MonacoEditor extends Vue {
    @Prop({ type: Boolean, default: false }) diffEditor: boolean;
    @Prop({ type: [String, Number], default: '100%' }) width: string | number;
    @Prop({ type: [String, Number], default: '100%' }) height: string | number;
    @Prop({ type: String }) original: string;
    @Prop({ type: String }) value: string;
    @Prop({ type: String, default: 'javascript' }) language: string;
    @Prop({ type: String, default: 'vs' }) theme: string;
    @Prop({
      type: Object,
      default: () => {
        return {};
      }
    })
    options: any;
    @Prop({ type: Function, default: noop }) editorMounted: Function;
    @Prop({ type: Function, default: noop }) editorBeforeMount: Function;
  }

  export const monaco;
  export default MonacoEditor;
}
declare module '*.scss';

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module 'vue-virtual-scroller' {
  import Vue, { Component, ComponentOptions, PluginObject } from 'vue';

  interface PluginOptions {
    installComponents?: boolean;
    componentsPrefix?: string;
  }

  const plugin: PluginObject<PluginOptions> & { version: string };

  export const RecycleScroller: Component<any, any, any, any>;
  export const DynamicScroller: Component<any, any, any, any>;
  export const DynamicScrollerItem: Component<any, any, any, any>;

  export function IdState(options?: { idProp?: (vm: any) => any }): ComponentOptions<Vue> | typeof Vue;

  export default plugin;
}

declare module 'vue-context' {
  import { Emit, Prop, Vue } from 'vue-property-decorator';

  /// see more options in [here](https://github.com/rawilk/vue-context/blob/master/src/js/vue-context.js)
  class VueContext extends Vue {
    @Prop({ type: Boolean, default: true }) closeOnClick: boolean;
    @Prop({ type: Boolean, default: true }) closeOnScroll: boolean;
    @Prop({ type: Boolean, default: false }) lazy: boolean;
    @Prop({
      type: [String, Array],
      default: () => ['.v-context-item', '.v-context > li > a']
    })
    itemSelector: [string, string[]];
    @Prop({ type: String, default: 'menu' }) role: string;
    @Prop({ type: Number, default: 10 }) subMenuOffset: number;
    @Prop({ type: Boolean, default: false }) useScrollHeight: boolean;
    @Prop({ type: Boolean, default: false }) useScrollWidth: boolean;
    @Prop({ type: Number, default: 25 }) heightOffset: number;
    @Prop({ type: Number, default: 25 }) widthOffset: number;
    @Prop({ type: String, default: 'ul' }) tag: string;

    top: number | null = null;
    lef: number | null = null;
    show = false;
    data: any | null = null;
    localItemSelector = '';
    activeSubMenu: any | null = null;

    @Emit('close')
    abstract close(): void;

    abstract focusItem(index: number, items: Element[]): void;

    abstract focusNext(event: Event, up: any): void;

    abstract getItems(): Element[];

    abstract onClick(): void;

    abstract onKeydown(event: Event): void;

    @Emit('open')
    abstract open(event: Event, data: any): void;

    abstract openSubMenu(event: Event): void;

    abstract closeSubMenu(event: Event): void;
  }

  export default VueContext;
}
