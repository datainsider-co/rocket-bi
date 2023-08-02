export const GoogleAnalyticTables = [
  {
    id: 'audience_affinity',
    name: 'audience_affinity',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:userGender'
      },
      {
        name: 'ga:userAgeBracket'
      },
      {
        name: 'ga:language'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:userType'
      },
      {
        name: 'ga:interestAffinityCategory'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'audience_interest',
    name: 'audience_interest',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:userGender'
      },
      {
        name: 'ga:userAgeBracket'
      },
      {
        name: 'ga:language'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:userType'
      },
      {
        name: 'ga:interestOtherCategory'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'audience_in_market',
    name: 'audience_in_market',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:userGender'
      },
      {
        name: 'ga:userAgeBracket'
      },
      {
        name: 'ga:language'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:userType'
      },
      {
        name: 'ga:interestInMarketCategory'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'audience_location',
    name: 'audience_location',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:country'
      },
      {
        name: 'ga:region'
      },
      {
        name: 'ga:city'
      },
      {
        name: 'ga:language'
      },
      {
        name: 'ga:deviceCategory'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'audience_device',
    name: 'audience_device',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:mobileDeviceBranding'
      },
      {
        name: 'ga:mobileDeviceModel'
      },
      {
        name: 'ga:operatingSystem'
      },
      {
        name: 'ga:browser'
      },
      {
        name: 'ga:browserVersion'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'webpage_content',
    name: 'webpage_content',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:pagePath'
      },
      {
        name: 'ga:pageTitle'
      },
      {
        name: 'ga:landingPagePath'
      },
      {
        name: 'ga:exitPagePath'
      },
      {
        name: 'ga:previousPagePath'
      },
      {
        name: 'ga:nextPagePath'
      }
    ],
    metrics: [
      {
        expression: 'ga:pageviews',
        alias: 'ga_pageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:uniquePageviews',
        alias: 'ga_uniquePageviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:entrances',
        alias: 'ga_entrances',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageValue',
        alias: 'ga_pageValue',
        dataType: 'float'
      },
      {
        expression: 'ga:pageLoadTime',
        alias: 'ga_pageLoadTime',
        dataType: 'int64'
      },
      {
        expression: 'ga:uniqueDimensionCombinations',
        alias: 'ga_uniqueDimensionCombinations',
        dataType: 'int64'
      },
      {
        expression: 'ga:pageDownloadTime',
        alias: 'ga_pageDownloadTime',
        dataType: 'int64'
      },
      {
        expression: 'ga:bounceRate',
        alias: 'ga_bounceRate',
        dataType: 'float'
      },
      {
        expression: 'ga:timeOnPage',
        alias: 'ga_timeOnPage',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'app_screen_content',
    name: 'app_screen_content',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:screenName'
      },
      {
        name: 'ga:appVersion'
      },
      {
        name: 'ga:eventCategory'
      },
      {
        name: 'ga:eventAction'
      },
      {
        name: 'ga:eventLabel'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:screenviews',
        alias: 'ga_screenviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:totalEvents',
        alias: 'ga_totalEvents',
        dataType: 'int64'
      },
      {
        expression: 'ga:uniqueEvents',
        alias: 'ga_uniqueEvents',
        dataType: 'int64'
      },
      {
        expression: 'ga:eventValue',
        alias: 'ga_eventValue',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalCompletionsAll',
        alias: 'ga_goalCompletionsAll',
        dataType: 'int64'
      },
      {
        expression: 'ga:goalValueAll',
        alias: 'ga_goalValueAll',
        dataType: 'float'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'site_search',
    name: 'site_search',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:searchKeyword'
      },
      {
        name: 'ga:searchKeywordRefinement'
      },
      {
        name: 'ga:searchDestinationPage'
      },
      {
        name: 'ga:searchCategory'
      }
    ],
    metrics: [
      {
        expression: 'ga:searchUniques',
        alias: 'ga_searchUniques',
        dataType: 'int64'
      },
      {
        expression: 'ga:searchResultViews',
        alias: 'ga_searchResultViews',
        dataType: 'int64'
      },
      {
        expression: 'ga:searchRefinements',
        alias: 'ga_searchRefinements',
        dataType: 'int64'
      },
      {
        expression: 'ga:searchDuration',
        alias: 'ga_searchDuration',
        dataType: 'float'
      },
      {
        expression: 'ga:searchExits',
        alias: 'ga_searchExits',
        dataType: 'int64'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'traffic_overview',
    name: 'traffic_overview',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:sourceMedium'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:city'
      },
      {
        name: 'ga:landingPagePath'
      },
      {
        name: 'ga:userGender'
      },
      {
        name: 'ga:userAgeBracket'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:screenviews',
        alias: 'ga_screenviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:exits',
        alias: 'ga_exits',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      },
      {
        expression: 'ga:pageLoadTime',
        alias: 'ga_pageLoadTime',
        dataType: 'int64'
      },
      {
        expression: 'ga:organicSearches',
        alias: 'ga_organicSearches',
        dataType: 'int64'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'campaign_overview',
    name: 'campaign_overview',
    dimensions: [
      {
        name: 'ga:date'
      },
      {
        name: 'ga:campaign'
      },
      {
        name: 'ga:deviceCategory'
      },
      {
        name: 'ga:city'
      },
      {
        name: 'ga:landingPagePath'
      },
      {
        name: 'ga:userGender'
      },
      {
        name: 'ga:userAgeBracket'
      }
    ],
    metrics: [
      {
        expression: 'ga:sessions',
        alias: 'ga_sessions',
        dataType: 'int64'
      },
      {
        expression: 'ga:users',
        alias: 'ga_users',
        dataType: 'int64'
      },
      {
        expression: 'ga:newUsers',
        alias: 'ga_newUsers',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactions',
        alias: 'ga_transactions',
        dataType: 'int64'
      },
      {
        expression: 'ga:screenviews',
        alias: 'ga_screenviews',
        dataType: 'int64'
      },
      {
        expression: 'ga:exits',
        alias: 'ga_exits',
        dataType: 'int64'
      },
      {
        expression: 'ga:transactionRevenue',
        alias: 'ga_transactionRevenue',
        dataType: 'float'
      },
      {
        expression: 'ga:pageLoadTime',
        alias: 'ga_pageLoadTime',
        dataType: 'int64'
      },
      {
        expression: 'ga:organicSearches',
        alias: 'ga_organicSearches',
        dataType: 'int64'
      }
    ],
    canIncrementalSync: true
  }
];
