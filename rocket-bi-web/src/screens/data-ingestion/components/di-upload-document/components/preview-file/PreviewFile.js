import DocumentService from '../../services/DocumentService';
import UploadDocumentStageMixin from '../../mixins/UploadDocumentStage';
import { COLUMN_DATA_TYPE, COLUMN_DATA_TYPE_NAME, DELIMITER, ENCODING } from '../../entities/Enum';
import UploadDocumentService from '../../services/UploadDocumentService';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default {
  name: 'PreviewFiles',
  mixins: [UploadDocumentStageMixin],
  data() {
    return {
      COLUMN_DATA_TYPE_NAME,
      encodings: Object.values(ENCODING),
      delimiters: Object.values(DELIMITER),
      classNames: Object.values(COLUMN_DATA_TYPE).map(id => ({ id, name: COLUMN_DATA_TYPE_NAME[id] })),
      records: []
    };
  },
  mounted() {
    this.initChunkContainer();
  },
  methods: {
    async initChunkContainer() {
      this.loading = true;
      this.value.chunkContainer = DocumentService.initChunkContainer(this.value.files[0], this.value.setting.chunkSize);
      Log.debug('chunk size:: ', this.value.setting.chunkSize);
      if (this.value.chunkContainer.total <= 0) {
        this.error = 'File is empty. Please choose another file!';
      } else {
        this.error = '';
        //TODO: CHUNK SIZE PREVIEW HEADER
        const previewChunkSize = 102400;
        await DocumentService.readChunk(this.value.files[0], this.value.chunkContainer, previewChunkSize, this.value.setting.encoding);
        await this.calcPreviewData();
      }
      this.loading = false;
    },
    async calcPreviewData(previewWithSchema = false) {
      this.loading = true;
      //let -> const
      const previewData = this.value.chunkContainer.prevProcessItem.lines.join('\n');
      let schema = undefined;
      if (previewWithSchema) {
        schema = this.value.schema.serialize;
      }
      const resp = await UploadDocumentService.preview(previewData, this.value.setting.serialize, schema);
      if (resp.error) {
        this.error = resp.message;
      } else {
        this.error = '';
        this.previewData = resp.data;
        this.value.schema = resp.data.schema;
        this.records = resp.data.records;
      }
      this.loading = false;
      Log.debug(resp);
    },
    changeColumnClassName(column, newClassName) {
      column.class_name = newClassName.id;
      this.calcPreviewData(true);
      TrackingUtils.track(TrackEvents.ColumnChangeType, { column_name: column.name, column_old_type: column.class_name, column_new_type: newClassName.id });
    },
    changeEncoding(newEncoding) {
      if (!this.value.setting.encoding !== newEncoding) {
        this.value.setting.encoding = newEncoding;
        this.initChunkContainer();
        TrackingUtils.track(TrackEvents.SelectEncoding, { type: newEncoding });
      }
    },
    changeDelimiter(newDelimiter) {
      if (!this.value.setting.delimiter !== newDelimiter) {
        this.value.setting.delimiter = newDelimiter;
        this.calcPreviewData();
        TrackingUtils.track(TrackEvents.SelectSelectDelimiter, { type: newDelimiter });
      }
    }
  }
};
