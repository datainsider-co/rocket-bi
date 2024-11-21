import UploadDocumentStageMixin from '../../mixins/UploadDocumentStage';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default {
  name: 'BrowseFile',
  mixins: [UploadDocumentStageMixin],
  // props: {
  //   value: UploadDocumentInfo
  // },
  data() {
    return {
      isDragOver: false,
      files: []
    };
  },
  methods: {
    reset() {
      this.isDragOver = false;
      this.files = [];
    },
    show() {
      this.reset();
      this.$refs.modal.show();
    },
    onDrop(e) {
      e.preventDefault();
      this.isDragOver = false;
      const files = [];
      if (e.dataTransfer.items) {
        Log.debug('e.dataTransfer.items');
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            files.push(e.dataTransfer.items[i].getAsFile());
          }
        }
      } else {
        Log.debug('e.dataTransfer.files');
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }
      this.files = files;
      TrackingUtils.track(TrackEvents.SelectFilePath, { file_name: files[0]?.name ?? 'unknown', file_type: files[0].type ?? 'unknown' });
    },
    onChangeFile(e) {
      const files = [];
      for (let i = 0; i < e.target.files.length; i++) {
        files.push(e.target.files[0]);
      }
      this.files = files;
      TrackingUtils.track(TrackEvents.SelectFilePath, { file_name: files[0]?.name ?? 'unknown', file_type: files[0].type ?? 'unknown' });
    },
    onDragOver(e) {
      this.isDragOver = true;
      e.preventDefault();
    },
    onDragLeave(e) {
      Log.debug('onDragOver', e);
      this.isDragOver = false;
    },
    browserLocalFiles() {
      this.$refs.file.value = null;
      this.$refs.file.click();
    }
  },
  watch: {
    files() {
      if (this.files.length > 1) {
        this.error = 'Too many files! Please drag only one file!';
        // this.$alert.fire({
        //   icon: 'error',
        //   title: 'Too many files',
        //   text: "Please drag only one file. Let's try again!"
        // });
        // Modals.showAlertModal("Please drag only one file. Let's try again!");
        // PopupUtils.showError("Please drag only one file. Let's try again!");
        this.files = [];
      } else if (this.files[0] && this.files[0].size <= 0) {
        this.error = 'Your CSV file is empty. Please choose another file!';
        // this.$alert.fire({
        //   icon: 'error',
        //   title: 'Your CSV file is invalid',
        //   text: 'This File is empty. Please choose another file!'
        // });
        // Modals.showAlertModal('This File is empty. Please choose another file!');
        // PopupUtils.showError('This File is empty. Please choose another file!');
        this.files = [];
      } else if (this.files[0] && this.value) {
        this.error = '';
        this.value.files = this.files;
        this.value.next();
      }
      this.files.forEach((file, i) => Log.debug('... file[' + i + '].name = ' + file.name));
    }
  }
};
