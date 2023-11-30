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
    testConfig: AppConfig;

    chartSetting: any;

    queryLanguages: QueryLanguage;
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
    VUE_APP_STATIC_FILE_URL: string;
    VUE_APP_FACEBOOK_APP_ID: string;
    VUE_APP_FACEBOOK_SCOPE: string;
    VUE_APP_TIKTOK_REDIRECT_URL: string;
    VUE_APP_TIKTOK_ID: string;

    VUE_APP_IS_DISABLE_LAKE_HOUSE: boolean;
    VUE_APP_IS_DISABLE_CDP: boolean;
    VUE_APP_IS_DISABLE_INGESTION: boolean;
    VUE_APP_IS_DISABLE_USER_ACTIVITIES: boolean;
    VUE_APP_DEFAULT_PASSWORD: string;

    VUE_APP_STATIC_DOMAIN: string;
    VUE_APP_STATIC_MEDIA_PATH: string;
    SHUTTER_ACCESS_TOKEN: string;

    SAAS_DOMAIN: string;
    REGISTER_URL: string;
    //Forgot password config
    TOTAL_PIN_CODE: number;
    TIMEOUT_SHOW_RESEND_SECOND: number;

    //third party ingestion config
    GOOGLE_CLIENT_ID: string;
    GOOGLE_ROOT_ORIGIN: string;

    GOOGLE_SHEET_URL: string;
    GOOGLE_SHEET_SCOPES: string;
    GA_URL: string;
    GA_SCOPES: string;
    GA4_URL: string;
    GA4_SCOPES: string;
    GOOGLE_ADS_URL: string;
    GOOGLE_ADS_SCOPES: string;
    GOOGLE_SEARCH_CONSOLE_URL: string;
    GOOGLE_SEARCH_CONSOLE_SCOPES: string;
    FACEBOOK_ADS_URL: string;
    TIKTOK_ADS_URL: string;
  }
  export interface QueryLanguage {
    clickHouse: { default: string };
    python3: { default: string };
  }
}
