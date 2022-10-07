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
    appConfig: AppConfig;
  }

  export interface AppConfig {
    VUE_APP_IS_DISABLE_STREAMING?: boolean;
    VUE_APP_TIME_OUT: number;
    VUE_APP_GOOGLE_CLIENT_ID: string;
    VUE_APP_EXPORT_MAX_FILE_SIZE: number;
    VUE_APP_PROFILER_ENABLED: boolean;
    VUE_APP_SHOPIFY_SCOPE?: string;
    VUE_APP_SHOPIFY_API_VERSION?: string;
    VUE_APP_CAAS_API_URL: string;
    VUE_APP_BI_API_URL: string;
    VUE_APP_SCHEMA_API_URL: string;
    VUE_APP_DATA_COOK_API_URL: string;
    VUE_APP_LAKE_API_URL: string;
    VUE_APP_CDP_API_URL: string;
    VUE_APP_STATIC_API_URL: string;
    VUE_APP_BILLING_API_URL: string;
    VUE_APP_WORKER_API_URL: string;
    VUE_APP_SCHEDULER_API_URL: string;
    VUE_APP_RELAY_API_URL: string;
  }
}
