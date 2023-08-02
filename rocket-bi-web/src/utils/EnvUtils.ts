import ClickhouseConfig from '@/screens/organization-settings/views/clickhouse-config/ClickhouseConfig.vue';
import { ConnectionModule, ConnectionStore } from '@/screens/organization-settings/stores/ConnectionStore';

export default class EnvUtils {
  static isDisableLakeHouse(): boolean {
    const value = window.appConfig.VUE_APP_IS_DISABLE_LAKE_HOUSE || false;
    return value;
  }

  static isDisableCDP(): boolean {
    const value = window.appConfig.VUE_APP_IS_DISABLE_CDP || false;
    return value;
  }

  static isDisableIngestion(): boolean {
    const value = window.appConfig.VUE_APP_IS_DISABLE_INGESTION || false;
    return value;
  }

  static isDisableStreaming(): boolean {
    const value = window.appConfig.VUE_APP_IS_DISABLE_STREAMING || false;
    return value;
  }

  static isDisableUserActivities(): boolean {
    const value = window.appConfig.VUE_APP_IS_DISABLE_USER_ACTIVITIES || false;
    return value;
  }

  private static parseEnvValue(value: any, defaultValue: boolean): boolean {
    try {
      return JSON.parse(value) ?? defaultValue;
    } catch (ex) {
      return defaultValue;
    }
  }
}
