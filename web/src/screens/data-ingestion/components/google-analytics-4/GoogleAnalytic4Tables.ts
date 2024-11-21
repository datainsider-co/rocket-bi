export const GoogleAnalytic4Tables = [
  {
    id: 'site_content',
    name: 'site_content',
    metrics: [
      {
        name: 'screenPageViews',
        dataType: 'int64'
      },
      {
        name: 'engagedSessions',
        dataType: 'int64'
      },
      {
        name: 'newUsers',
        dataType: 'int64'
      },
      {
        name: 'totalUsers',
        dataType: 'int64'
      },
      {
        name: 'eventCount',
        dataType: 'int64'
      },
      {
        name: 'conversions',
        dataType: 'float'
      },
      {
        name: 'averageSessionDuration',
        dataType: 'float'
      },
      {
        name: 'userEngagementDuration',
        dataType: 'float'
      }
    ],
    dimensions: [
      {
        name: 'date'
      },
      {
        name: 'dateHour'
      },
      {
        name: 'unifiedPagePathScreen'
      },
      {
        name: 'unifiedScreenName'
      },
      {
        name: 'pageReferrer'
      },
      {
        name: 'searchTerm'
      },
      {
        name: 'firstUserSourceMedium'
      },
      {
        name: 'firstSessionDate'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'audience_insights',
    name: 'audience_insights',
    metrics: [
      {
        name: 'screenPageViews',
        dataType: 'int64'
      },
      {
        name: 'engagedSessions',
        dataType: 'int64'
      },
      {
        name: 'newUsers',
        dataType: 'int64'
      },
      {
        name: 'totalUsers',
        dataType: 'int64'
      },
      {
        name: 'eventCount',
        dataType: 'int64'
      },
      {
        name: 'conversions',
        dataType: 'float'
      },
      {
        name: 'averageSessionDuration',
        dataType: 'float'
      },
      {
        name: 'userEngagementDuration',
        dataType: 'float'
      }
    ],
    dimensions: [
      {
        name: 'date'
      },
      {
        name: 'dateHour'
      },
      {
        name: 'country'
      },
      {
        name: 'city'
      },
      {
        name: 'userAgeBracket'
      },
      {
        name: 'userGender'
      },
      {
        name: 'brandingInterest'
      }
    ],
    canIncrementalSync: true
  },
  {
    id: 'event',
    name: 'event',
    metrics: [
      {
        name: 'screenPageViews',
        dataType: 'int64'
      },
      {
        name: 'totalUsers',
        dataType: 'int64'
      },
      {
        name: 'eventCount',
        dataType: 'int64'
      }
    ],
    dimensions: [
      {
        name: 'date'
      },
      {
        name: 'dateHour'
      },
      {
        name: 'dateHourMinute'
      },
      {
        name: 'eventName'
      }
    ],
    canIncrementalSync: true
  }
];
