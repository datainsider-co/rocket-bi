import UploadGoogleSheetStageMixin from '../../mixins/UploadGoogleSheetStageMixin';
import { COLUMN_DATA_TYPE, COLUMN_DATA_TYPE_NAME, DELIMITER, ENCODING } from '../../../di-upload-document/entities/Enum';
import UploadDocumentService from '../../../di-upload-document/services/UploadDocumentService';
import { Log } from '@core/utils';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { StringUtils } from '@/utils/StringUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default {
  name: 'PreviewGoogleSheet',
  mixins: [UploadGoogleSheetStageMixin],
  data() {
    return {
      COLUMN_DATA_TYPE_NAME,
      // encodings: Object.values(ENCODING),
      // delimiters: Object.values(DELIMITER),
      classNames: Object.values(COLUMN_DATA_TYPE).map(id => ({ id, name: COLUMN_DATA_TYPE_NAME[id] })),
      records: [],
      delimiter: '\t'
    };
  },
  mounted() {
    this.calcPreviewData();
  },
  methods: {
    async calcPreviewData(previewWithSchema = false) {
      this.loading = true;
      const previewData = await this.getPreviewData();

      await this.preview(previewData, previewWithSchema);
      this.loading = false;
    },
    async getPreviewData() {
      //${this.value.sheetTitle}!1:100 ranges option get 1-100 row data of sheet title
      const records = await GoogleUtils.getSheetRecords(this.value.spreadsheetId, `${this.value.sheetTitle}!1:100`);
      let previewData = '';
      if (records && records.result.valueRanges && records.result.valueRanges[0].values) {
        previewData = this.sparseToCsvData(records.result.valueRanges[0].values);
      }
      return previewData;
    },
    async preview(previewData, previewWithSchema) {
      let schema = undefined;
      if (previewWithSchema) {
        schema = this.value.schema.serialize;
      }
      if (StringUtils.isNotEmpty(previewData)) {
        const resp = await UploadDocumentService.preview(previewData, { ...this.value.setting.serialize, delimiter: this.delimiter }, schema);
        if (resp.error) {
          this.error = resp.message;
        } else {
          this.error = '';
          this.previewData = resp.data;
          this.value.schema = resp.data.schema;
          this.records = resp.data.records;
        }
      } else {
        this.error = 'Your sheets is empty';
      }
    },
    changeColumnClassName(column, newClassName) {
      column.class_name = newClassName.id;
      this.calcPreviewData(true);
      TrackingUtils.track(TrackEvents.ColumnChangeType, {
        column_name: column.name,
        column_new_type: newClassName.id,
        column_old_type: column.class_name
      });
    },
    sparseToCsvData(records) {
      const re = new RegExp('\\r?\\n', 'g');
      return records
        .map(rowData => {
          return rowData.join(this.delimiter).replaceAll(re, ' ');
        })
        .join('\n');
    }
  }
};
