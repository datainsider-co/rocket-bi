const productionConfig = {
  VUE_APP_TIME_OUT: 180000,
  VUE_APP_GOOGLE_CLIENT_ID: '',
  VUE_APP_EXPORT_MAX_FILE_SIZE: 50000000,
  VUE_APP_PROFILER_ENABLED: true,
  VUE_APP_CAAS_API_URL: '/api',
  VUE_APP_BI_API_URL: '/api',
  VUE_APP_SCHEMA_API_URL: '/api',
  VUE_APP_DATA_COOK_API_URL: '/api',
  VUE_APP_LAKE_API_URL: '/api',
  VUE_APP_CDP_API_URL: '/api',
  VUE_APP_BILLING_API_URL: 'https://rocketbi.cf/api',
  VUE_APP_WORKER_API_URL: '/api',
  VUE_APP_SCHEDULER_API_URL: '/api',
  VUE_APP_RELAY_API_URL: '/api',
  VUE_APP_STATIC_FILE_URL: '/static',
  VUE_APP_FACEBOOK_APP_ID: '',
  VUE_APP_FACEBOOK_APP_SECRET: '',
  VUE_APP_FACEBOOK_SCOPE: 'ads_management,ads_read',
  VUE_APP_TIKTOK_REDIRECT_URL: 'https://rocketbi.cf/third-party-auth/tik-tok',
  VUE_APP_TIKTOK_ID: '',

  VUE_APP_IS_DISABLE_LAKE_HOUSE: true,
  VUE_APP_IS_DISABLE_STREAMING: true,
  VUE_APP_IS_DISABLE_CDP: true,
  VUE_APP_IS_DISABLE_INGESTION: false,
  VUE_APP_IS_DISABLE_USER_ACTIVITIES: false,
  VUE_APP_DEFAULT_PASSWORD: 'di@123456',

  // upload
  VUE_APP_STATIC_API_URL: '/api/static',
  VUE_APP_STATIC_DOMAIN: '',
  VUE_APP_STATIC_MEDIA_PATH: 'static/media',

  //search image
  SHUTTER_ACCESS_TOKEN: '',

  SAAS_DOMAIN: 'rocket.bi',
  REGISTER_URL: 'https://rocket.bi/register',
  //Forgot password config
  TOTAL_PIN_CODE: 6,
  TIMEOUT_SHOW_RESEND_SECOND: 180
};

window.appConfig = productionConfig;
