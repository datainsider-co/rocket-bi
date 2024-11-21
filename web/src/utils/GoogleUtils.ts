import { DIException } from '@core/common/domain';
import { GA4Metric } from '@core/data-ingestion/domain/job/ga4/GA4Mertric';
import { Ga4Dimension } from '@core/data-ingestion/domain/job/ga4/Ga4Dimension';
import { Log } from '@core/utils';

export abstract class GoogleUtils {
  static setupGoogleDriveClient(accessToken: string): Promise<void> {
    gapi.client.setToken({ access_token: accessToken });
    return gapi.client.load('https://content.googleapis.com/discovery/v1/apis/drive/v3/rest', 'v3');
  }

  static setupGoogleSheetClient(accessToken: string) {
    gapi.client.setToken({ access_token: accessToken });
    return gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4', 'v4');
  }

  // login with google
  static loginGoogle(clientId: string, scope: string): Promise<gapi.auth2.AuthorizeResponse> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new DIException('"https://apis.google.com/js/api:client.js" needs to be included as a <script>.'));
      }
      window.gapi.load('auth2', async () => {
        // @ts-ignore
        window.gapi.auth2.authorize(
          {
            client_id: clientId,
            scope: scope,
            // fixme: migrate to new api https://developers.google.com/identity/gsi/web/guides/migration
            plugin_name: 'App used in google developer console API',
            response_type: 'id_token code permission',
            prompt: 'consent'
          } as any,
          (response: gapi.auth2.AuthorizeResponse) => {
            if (response.error) {
              Log.error('loginGoogle::', response);
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    });
  }

  //q: A query for filtering the file results.
  //doc: https://developers.google.com/drive/api/v3/reference/files/list
  static listSpreadsheetResponse(): Promise<gapi.client.Response<gapi.client.drive.FileList>> {
    return gapi.client.drive.files
      .list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'"
      })
      .then(response => {
        // Handle the results here (response.result has the parsed body).
        return response;
      });
  }

  //get list sheet from spreadsheetId|
  //doc: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get
  static listSheetResponse(spreadsheetId: string, includeGridData = false): Promise<gapi.client.Response<gapi.client.sheets.Spreadsheet>> {
    return gapi.client.sheets.spreadsheets
      .get({
        spreadsheetId: spreadsheetId,
        includeGridData: includeGridData
      })
      .then(response => {
        return response;
      });
  }

  static getSheetRecords(spreadsheetId: string, ranges: string): Promise<gapi.client.Response<gapi.client.sheets.BatchGetValuesResponse>> {
    return gapi.client.sheets.spreadsheets.values.batchGet({ spreadsheetId: spreadsheetId, ranges: ranges });
  }

  static getUserProfile(accessToken: string) {
    return gapi.client.request({
      path: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      params: {
        // eslint-disable-next-line
        access_token: accessToken
      }
    });
  }

  static loadGoogleAnalyticClient(accessToken: string) {
    gapi.client.setToken({ access_token: accessToken });
    return gapi.client.load('https://content.googleapis.com/discovery/v1/apis/analytics/v3/rest', 'v3');
  }

  static getGoogleAnalyticProperty(accountId: string): Promise<gapi.client.Response<gapi.client.analytics.Webproperties>> {
    return gapi.client.analytics.management.webproperties.list({
      accountId: accountId
    });
  }

  static async loadGA4Client(accessToken: string) {
    gapi.client.setToken({ access_token: accessToken });
    await Promise.all([
      gapi.client.load('https://analyticsreporting.googleapis.com/$discovery/rest?version=v4', 'v4'),
      gapi.client.load('https://analyticsdata.googleapis.com/$discovery/rest', ''),
      gapi.client.load('https://analyticsadmin.googleapis.com/$discovery/rest', '')
    ]);
  }

  static getDimensionsAndMetrics(propertyName: string): gapi.client.Request<gapi.client.analyticsdata.Metadata> {
    return gapi.client.analyticsdata.properties.getMetadata({
      name: propertyName + '/metadata'
    });
  }

  static getGoogleAnalyticViewProperty(accountId: string, webPropertyId: string): Promise<gapi.client.Response<gapi.client.analytics.Profiles>> {
    return gapi.client.analytics.management.profiles.list({
      accountId: accountId,
      webPropertyId: webPropertyId
    });
  }

  //require load google analytic client before
  static getGA4AccountSummarizes(): gapi.client.Request<gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaListAccountSummariesResponse> {
    return gapi.client.analyticsadmin.accountSummaries.list({});
  }

  static compatibleDimensionsAndMetrics(
    property: string,
    dimensions: Ga4Dimension[],
    metrics: GA4Metric[]
  ): Promise<gapi.client.Response<gapi.client.analyticsdata.CheckCompatibilityResponse>> {
    return gapi.client.request({
      path: `https://content-analyticsdata.googleapis.com/v1beta/${property}:checkCompatibility`,
      method: 'POST',
      body: JSON.stringify({
        property: property,
        dimensions: dimensions.map(dimension => {
          return { name: dimension.name };
        }),
        metrics: metrics.map(metric => {
          return { name: metric.name };
        })
      })
    });
  }

  static loadGoogleSearchConsoleClient(accessToken: string): Promise<void> {
    gapi.client.setToken({ access_token: accessToken });
    return gapi.client.load('https://content.googleapis.com/discovery/v1/apis/searchconsole/v1/rest', 'v1beta');
  }

  static listSiteUrls(): { siteUrl: string }[] {
    //@ts-ignore
    return gapi.client.webmasters.sites.list({}).then((response: any) => {
      Log.debug('GoogleUtils::listSiteUrls::response::', response);
      return response.result.siteEntry;
    });
  }
}
