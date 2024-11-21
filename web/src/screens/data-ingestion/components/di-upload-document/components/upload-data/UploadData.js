import UploadDocumentStageMixin from '../../mixins/UploadDocumentStage';
import UploadDocumentService from '../../services/UploadDocumentService';
import DocumentService from '../../services/DocumentService';
import { Log } from '@core/utils';
import { Routers } from '@/shared';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';

const Modal = () => import('../commons/Modal.vue');
const POOL_SIZE = 1;
const OFFSET_AUTO_SCROLL_LASTED = 60;

export default {
  mixins: [UploadDocumentStageMixin],
  components: { Modal },
  name: 'UploadData',
  data() {
    return {
      isStopped: false,
      skipAll: false,
      backgroundRunning: false,
      currentStartChunkIndex: 0,
      autoScrollDetail: true
    };
  },
  computed: {
    detailChunkItems() {
      if (!this.value?.chunkContainer) return [];
      return this.value.chunkContainer.items.filter(chunk => chunk.loading || chunk.done);
    }
  },
  methods: {
    show() {
      this.$refs.modal.show();
    },
    async close() {
      if (!this.value.chunkContainer.done && !this.isStopped) {
        const { isConfirmed } = await this.$alert.fire({
          icon: 'warning',
          title: 'Uploading progress has not finished yet!',
          html: 'Do you want to stop uploading?',
          confirmButtonText: 'Yes',
          showCancelButton: true,
          cancelButtonText: 'No'
        });
        if (isConfirmed) {
          this.stop();
        }
        return;
      }
      this.$refs.modal.hide();
      this.value.chunkContainer.reset();
    },
    minimize() {
      this.backgroundRunning = true;
      this.$refs.modal.hide();
    },
    maximize() {
      this.backgroundRunning = false;
      this.show();
    },
    stop() {
      this.isStopped = true;
    },
    async processErrorChunks(uploadedChunks) {
      if (this.isStopped || this.skipAll) return;
      let count = 0;
      while (count < uploadedChunks.length) {
        const chunkItem = uploadedChunks[count++];
        if (!chunkItem.error) continue;

        const { isConfirmed, isDenied } = await this.$alert.fire({
          icon: 'error',
          title: `Upload <strong>chunk ${chunkItem.index + 1}</strong> fail`,
          html: `Do you want skip this error and continue uploading?`,
          confirmButtonText: 'Skip All',
          showDenyButton: true,
          denyButtonText: 'Stop',
          showCancelButton: true,
          cancelButtonText: 'Skip One'
        });

        if (isConfirmed) {
          Log.debug('Skip all error');
          this.skipAll = true;
          break;
        } else if (isDenied) {
          Log.debug('Stop upload');
          this.stop();
          break;
        }
      }
    },
    async startUpload() {
      this.value.chunkContainer.reset();
      this.isStopped = false;
      this.skipAll = false;
      this.autoScrollDetail = true;
      this.loading = true;
      this.currentStartChunkIndex = 0;
      while (!this.isStopped && this.currentStartChunkIndex < this.value.chunkContainer.total) {
        //let -> const
        const processItems = this.value.chunkContainer.items.slice(this.currentStartChunkIndex, this.currentStartChunkIndex + POOL_SIZE);
        // step 1: Read chunks
        for (let i = 0; i < processItems.length; i++) {
          await DocumentService.readChunk(this.value.files[0], this.value.chunkContainer, this.value.setting.chunkSize, this.value.setting.encoding);
        }
        const uploadedChunks = await Promise.all(processItems.map(this.processUploadChunkItem));
        this.currentStartChunkIndex += POOL_SIZE;
        await this.processErrorChunks(uploadedChunks);
        Log.debug(`DONE ${this.currentStartChunkIndex}`);
      }
      // if (!this.isStopped && this.value.chunkContainer.failItems.length) {
      //   // this.$alert.fire('Has errors during uploading progress!', 'Please check the detail for more information');
      // }
      await this.onUploadComplete();
      this.loading = false;
      this.isStopped = true;
    },
    async onUploadComplete() {
      const databaseSchema = await DatabaseSchemaModule.fetchDatabaseInfo(this.value.schema.db_name);
      DatabaseSchemaModule.setDatabaseInfo(databaseSchema);
    },
    reUpload() {
      // this.value.chunkContainer.reset();
      this.startUpload();
    },
    async processUploadChunkItem(chunkItem) {
      if (this.isStopped) return chunkItem;
      chunkItem.loading = true;
      this.scrollLastedDetail();
      // setting.include_header
      let data = chunkItem.lines.join('\n');
      if (this.value.setting.include_header && chunkItem.index === 0) {
        data = chunkItem.lines.slice(1).join('\n');
      }

      const resp = await UploadDocumentService.upload(
        {
          csv_id: this.value.registerInfo.id,
          batch_number: chunkItem.index,
          data: data,
          is_end: chunkItem.index === this.value.chunkContainer.total - 1
        },
        processEvent => {
          Log.debug(processEvent);
          if (processEvent) {
            chunkItem.loadingPercent = ((100 * processEvent.loaded) / processEvent.total).toFixed(1);
          }
        }
      );

      if (resp.error) {
        chunkItem.loading = false;
        chunkItem.loadingPercent = 0;
        chunkItem.error = resp.message;
        Log.debug(resp.message);
      } else {
        chunkItem.success = true;
        chunkItem.loading = false;
        delete chunkItem.lines;
        chunkItem.lines = [];
      }
      chunkItem.done = true;
      return chunkItem;
    },
    handleUploadSuccess() {
      try {
        this.$refs.modal.hide();
        Log.debug('value::', this.value.schema);
        this.$router.push({
          name: Routers.DataSchema,
          query: {
            database: this.value.schema.db_name,
            table: this.value.schema.name
          }
        });
      } catch (e) {
        Log.error('UploadData.ctrl.js::handleUploadSuccess::exception::', e.message);
      }
    },
    onScrollDetail() {
      this.autoScrollDetail = this.$refs.detail.scrollHeight - this.$refs.detail.scrollTop - this.$refs.detail.clientHeight <= OFFSET_AUTO_SCROLL_LASTED;
    },
    scrollLastedDetail() {
      if (this.autoScrollDetail) {
        this.$nextTick(() => {
          this.$refs.detail.scrollTop = this.$refs.detail.scrollHeight;
        });
      }
    }
  }
};
