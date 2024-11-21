import { UploadGoogleSheetInfo } from '@/screens/data-ingestion/components/di-upload-document/entities/UploadGoogleSheetInfo';
// import { CSVSetting } from '../service/entity/CSVSetting'
// import DocumentService from '../service/DocumentService'
// import { ChunkContainerInfo } from '../service/entity/ChunkContainerInfo'

export default {
  props: {
    value: UploadGoogleSheetInfo
  },
  data() {
    return {
      loading: false,
      error: ''
    };
  },
  computed: {
    canNext() {
      return !this.loading && !this.error;
    }
  },
  methods: {
    next() {
      this.value.next();
    },
    back() {
      this.value.back();
    }
  }
};
