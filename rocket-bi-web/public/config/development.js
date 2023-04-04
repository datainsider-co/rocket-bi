const devConfig = {
  VUE_APP_IS_DISABLE_STREAMING: true,
  VUE_APP_SHOPIFY_SCOPE:
    'read_analytics, read_customers, read_discounts, read_draft_orders, read_files, read_fulfillments, read_gdpr_data_request, read_gift_cards, read_inventory, read_legal_policies, read_locations, read_marketing_events, read_merchant_managed_fulfillment_orders, read_online_store_pages, read_online_store_navigation, read_order_edits, read_orders, read_payment_terms, read_price_rules, read_product_listings, read_products, read_reports, read_resource_feedbacks, read_script_tags, read_shipping, read_locales, read_markets, read_shopify_payments_accounts, read_shopify_payments_bank_accounts, read_shopify_payments_disputes, read_shopify_payments_payouts, read_content, read_themes, read_third_party_fulfillment_orders, read_translations',
  VUE_APP_SHOPIFY_API_VERSION: '2022-04',
  VUE_APP_GOOGLE_CLIENT_ID: '147123631762-p2149desosmqr59un7mbjm2p65k566gh.apps.googleusercontent.com',
  VUE_APP_TIME_OUT: 180000,
  VUE_APP_EXPORT_MAX_FILE_SIZE: 50000000,
  VUE_APP_CAAS_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_BI_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_SCHEMA_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_DATA_COOK_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_LAKE_API_URL: 'https://oss.rocketbi.cf/api/lake',
  VUE_APP_CDP_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_STATIC_API_URL: 'https://oss.rocketbi.cf/static',
  VUE_APP_BILLING_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_WORKER_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_SCHEDULER_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_RELAY_API_URL: 'https://oss.rocketbi.cf/api',
  VUE_APP_STATIC_FILE_URL: 'https://oss.rocketbi.cf/static',
  VUE_APP_FACEBOOK_APP_ID: '1371850590286877',
  VUE_APP_FACEBOOK_SCOPE: 'ads_management,ads_read',
  VUE_APP_TIKTOK_REDIRECT_URL: 'https://oss.rocketbi.cf/third-party-auth/tik-tok',
  VUE_APP_TIKTOK_ID: '7174346320419766274',

  VUE_APP_IS_DISABLE_LAKE_HOUSE: true,
  VUE_APP_IS_DISABLE_CDP: true,
  VUE_APP_IS_DISABLE_INGESTION: false,
  VUE_APP_IS_DISABLE_USER_ACTIVITIES: false,
  VUE_APP_IS_DISABLE_CLICKHOUSE_CONFIG: false,
  VUE_APP_IS_DISABLE_BILLING: true,
  VUE_APP_VERSION: 'v1.4.19',
  VUE_APP_DEFAULT_PASSWORD: 'di@123456',
  VUE_APP_LOGIN_SAMPLE: {
    isShowHint: true,
    hintMessage: 'You can use test account demo@datainsider.co/demo@123 to login'
  }
};

window.appConfig = devConfig;
