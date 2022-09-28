import { UPLOAD_STAGE } from '../../entities/Enum';
import { UploadDocumentInfo } from '../../entities/UploadDocumentInfo';
import { Log } from '@core/utils';
import actions from '../../actions';
import BrowseFiles from '../BrowseFile/BrowseFile.vue';
import PreviewFiles from '../PreviewFile/PreviewFile.vue';
import DescribeDatabase from '../DescribeDatabase/DescribeDatabase.vue';
import Modal from '../commons/Modal.vue';
const UploadData = () => import('../UploadData/UploadData.vue');
export default {
  name: 'UploadDocument',
  components: { Modal, UploadData },
  data() {
    return {
      model: null
    };
  },
  computed: {
    title() {
      if (this.model) return this.model.title;
      return '';
    },
    desc() {
      if (this.model) return this.model.desc;
      return '';
    },
    isRenderUploadData() {
      return this.model && this.model.stage === UPLOAD_STAGE.uploading;
    },
    modalWidth() {
      const defaultWidth = 1030;
      const browseFileWidth = 648;
      const describeDatabaseWidth = 398;
      if (!this.model) return defaultWidth;
      switch (this.model.stage) {
        case UPLOAD_STAGE.browse_file:
          return browseFileWidth;
        case UPLOAD_STAGE.describe_db:
          return describeDatabaseWidth;
        default:
          return defaultWidth;
      }
    },
    bodyComponent() {
      if (!this.model) return null;
      switch (this.model.stage) {
        case UPLOAD_STAGE.browse_file:
          return BrowseFiles;
        case UPLOAD_STAGE.preview_file:
          return PreviewFiles;
        case UPLOAD_STAGE.describe_db:
          return DescribeDatabase;
        default:
          return null;
      }
    }
  },
  mounted() {
    actions.onShowUploadDocument(this.show);
  },
  destroy() {
    actions.offShowUploadDocument(this.show);
  },
  methods: {
    reset() {
      Log.debug('reset');
    },
    initModel() {
      // if (!this.model) {
      this.model = new UploadDocumentInfo();
      // } else {
      //
      // }
    },
    show() {
      if (this.$refs.upload && this.$refs.upload.backgroundRunning) {
        this.$refs.upload.maximize();
      } else {
        this.initModel();
        this.$refs.modal.show();
      }
    }
  },
  watch: {
    'model.stage'() {
      if (this.isRenderUploadData) {
        this.$refs.modal.hide();
        this.$refs.upload.show();
        this.$refs.upload.startUpload();
      }
    }
  }
};
