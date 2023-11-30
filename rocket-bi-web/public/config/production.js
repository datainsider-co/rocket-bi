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
  VUE_APP_BILLING_API_URL: 'https://license.rocket.bi/api',
  VUE_APP_WORKER_API_URL: '/api',
  VUE_APP_SCHEDULER_API_URL: '/api',
  VUE_APP_RELAY_API_URL: '/api',
  VUE_APP_STATIC_FILE_URL: '/static',
  VUE_APP_FACEBOOK_APP_ID: '',
  VUE_APP_FACEBOOK_APP_SECRET: '',
  VUE_APP_FACEBOOK_SCOPE: 'ads_management,ads_read',
  VUE_APP_TIKTOK_REDIRECT_URL: '',
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
  TIMEOUT_SHOW_RESEND_SECOND: 180,

  //Third party ingestion config
  GOOGLE_CLIENT_ID: '',
  GOOGLE_ROOT_ORIGIN: 'http://localhost:5050',
  GOOGLE_SHEET_URL: 'http://localhost:5050/third-party-auth/google-sheet',
  GA_URL: 'http://localhost:5050/third-party-auth/google-analytic',
  GA4_URL: 'http://localhost:5050/third-party-auth/ga4',
  GOOGLE_SEARCH_CONSOLE_URL: 'http://localhost:5050/third-party-auth/google-search-console',
  FACEBOOK_ADS_URL: 'http://localhost:5050/third-party-auth/facebook',
  TIKTOK_ADS_URL: 'http://localhost:5050/third-party-auth/tik-tok',
  GOOGLE_ADS_URL: 'http://localhost:5050/third-party-auth/google-advertise',
  GOOGLE_SHEET_SCOPES: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
  GA_SCOPES: 'profile https://www.googleapis.com/auth/analytics.readonly',
  GA4_SCOPES: 'profile https://www.googleapis.com/auth/analytics.readonly',
  GOOGLE_SEARCH_CONSOLE_SCOPES: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/webmasters',
  GOOGLE_ADS_SCOPES: 'https://www.googleapis.com/auth/adwords'
};

window.appConfig = productionConfig;
