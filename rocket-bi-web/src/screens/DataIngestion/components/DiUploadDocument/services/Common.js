import axios from 'axios';
import { Log } from '@core/utils';

const INSTANCE = {
  config: {
    api: '',
    headers: {},
    componentName: 'DiUploadComponent',
    chunkSize: 10000,
    timeout: 180000
  },
  http: null,
  initHttpClient(options = {}) {
    const httpClient = axios.create(options);
    httpClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          return Promise.resolve({
            error: true,
            message: error.response.data.message,
            reason: error.response.data.reason,
            data: error.response.data
          });
        } else if (error.request) {
          return Promise.resolve({ error: true, request: error.request, message: 'Empty response' });
        } else {
          return Promise.resolve({ error: true, message: error.message });
        }
      }
    );
    return httpClient;
  }
};

export const updateConfig = newConfig => {
  Object.keys(newConfig).forEach(key => {
    INSTANCE.config[key] = newConfig[key];
  });
  INSTANCE.http = INSTANCE.initHttpClient({
    baseURL: INSTANCE.config.api,
    headers: INSTANCE.config.headers,
    timeout: INSTANCE.config.timeout
  });
  Log.debug(INSTANCE.http);
};
export const http = () => {
  if (!INSTANCE.http) {
    INSTANCE.http = INSTANCE.initHttpClient({
      baseURL: INSTANCE.config.api,
      headers: INSTANCE.config.headers,
      timeout: INSTANCE.config.timeout
    });
  }
  return INSTANCE.http;
};

export const initHttpClient = INSTANCE.initHttpClient;
export const config = INSTANCE.config;

export default INSTANCE;
