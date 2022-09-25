import Vue, { VNode } from 'vue';
import { LogLevel } from '@core/utils/Log';
declare global {
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}

    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}

    interface ElementAttributesProperty {
      $props: {};
      [elem: string]: any;
    }

    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
  interface Window {
    logLevel: LogLevel;
    dumpLog: boolean;
    showFormattingColumn: boolean;
    $: any;
    dataLayer: object[];
  }
}
