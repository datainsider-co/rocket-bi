import UploadGoogleSheetStageMixin from '../../mixins/UploadGoogleSheetStageMixin';
import { Log } from '@core/utils';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { DIException } from '@core/common/domain';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default {
  name: 'GoogleSheetSelectionForm',
  mixins: [UploadGoogleSheetStageMixin],
  data() {
    return {
      listSpreadSheet: [],
      listSheet: [],
      sheetLoading: false,
      spreadsheetLoading: false
    };
  },
  mounted: async function() {
    if (ListUtils.isEmpty(this.listSpreadSheet)) {
      await this.handleLoadData();
    }
  },
  computed: {
    isError() {
      return StringUtils.isNotEmpty(this.error);
    }
  },
  methods: {
    reset() {
      Log.debug('reset google selection form');
    },
    show() {
      this.reset();
      this.$refs.modal.show();
    },
    handleLoadData: async function() {
      try {
        this.showSpreadsheetLoading();
        this.showSheetLoading();
        if (StringUtils.isEmpty(this.value.refreshToken)) {
          await this.loadRefreshToken();
        }
        await GoogleUtils.setupGoogleDriveClient(window.appConfig.GOOGLE_API_KEY, this.value.accessToken);
        const response = await GoogleUtils.listSpreadsheetResponse();
        this.hideSpreadsheetLoading();
        //todo: check valid files response
        await this.processFileResponse(response);
        this.error = '';
      } catch (e) {
        this.error = e.message;
      } finally {
        this.hideSpreadsheetLoading();
        this.hideSheetLoading();
      }
    },
    async loadRefreshToken() {
      const refreshToken = await DataSourceModule.getRefreshToken(this.value.authorizationCode);
      this.value.refreshToken = refreshToken;
    },
    async processFileResponse(fileResponse) {
      if (this.validFilesResponse(fileResponse)) {
        this.listSpreadSheet = fileResponse.result.files;
        this.value.spreadsheetId = this.listSpreadSheet[0].id;
        await this.loadListSheet();
      } else {
        throw new DIException('not found google sheet file in your drive');
      }
    },
    loadListSheet: async function() {
      try {
        this.showSheetLoading();
        await GoogleUtils.setupGoogleSheetClient(window.appConfig.GOOGLE_API_KEY, this.value.accessToken);
        const sheetResponse = await GoogleUtils.listSheetResponse(this.value.spreadsheetId);
        await this.processSheetResponse(sheetResponse);
        this.hideSheetLoading();
      } catch (e) {
        this.error = e.message;
      }
    },

    async handleSpreadSheetChange(option) {
      await this.loadListSheet();
      TrackingUtils.track(TrackEvents.SelectGoogleSheetFile, { file_name: option.name });
    },
    onChangeSheetTitle(option) {
      this.listSheet.map(sheetProperties => {
        if (sheetProperties.sheetId === option.sheetId) {
          this.value.sheetTitle = sheetProperties.title;
          return;
        }
      });
      TrackingUtils.track(TrackEvents.SelectSheet, { sheet_name: option.title });
    },
    async processSheetResponse(sheetResponse) {
      if (this.validSheetsResponse(sheetResponse)) {
        Log.debug('FileSheet::', sheetResponse.result.sheets[0].data);
        this.listSheet = sheetResponse.result.sheets?.map(sheet => sheet.properties);
        if (StringUtils.isEmpty(this.value.sheetId)) {
          this.value.sheetId = this.listSheet[0].sheetId;
          this.value.sheetTitle = this.listSheet[0].title;
        }
      } else {
        throw new DIException('listSheetResponse Invalid data');
      }
    },
    validSheetsResponse(response) {
      if (response && response.result && ListUtils.isNotEmpty(response.result.sheets)) {
        return true;
      } else {
        return false;
      }
    },
    validFilesResponse(response) {
      if (response && response.result && ListUtils.isNotEmpty(response.result.files)) {
        return true;
      } else {
        return false;
      }
    },
    showSpreadsheetLoading() {
      this.spreadsheetLoading = true;
    },
    showSheetLoading() {
      this.sheetLoading = true;
    },
    hideSpreadsheetLoading() {
      this.spreadsheetLoading = false;
    },
    hideSheetLoading() {
      this.sheetLoading = false;
    }
  }
};
