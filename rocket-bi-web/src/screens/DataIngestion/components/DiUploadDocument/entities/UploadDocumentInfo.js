import { UPLOAD_DESC, UPLOAD_STAGE, UPLOAD_TITLE } from './Enum';
import { CSVSetting } from './CSVSetting';
import { DocumentSchema } from './DocumentSchema';
import { ChunkContainerInfo } from './ChunkContainerInfo';

export class UploadDocumentInfo {
  constructor(stage) {
    this.stage = stage || UPLOAD_STAGE.browse_file;
    this.files = [];
    this.chunkContainer = new ChunkContainerInfo(0);
    this.schema = new DocumentSchema();
    this.setting = new CSVSetting();
    this.registerInfo = null;
  }

  get title() {
    return UPLOAD_TITLE[this.stage];
  }

  get desc() {
    return UPLOAD_DESC[this.stage];
  }

  next() {
    switch (this.stage) {
      case UPLOAD_STAGE.browse_file:
        this.stage = UPLOAD_STAGE.preview_file;
        break;
      case UPLOAD_STAGE.preview_file:
        this.stage = UPLOAD_STAGE.describe_db;
        break;
      case UPLOAD_STAGE.describe_db:
        this.stage = UPLOAD_STAGE.uploading;
        break;
    }
  }

  back() {
    switch (this.stage) {
      case UPLOAD_STAGE.preview_file:
        this.stage = UPLOAD_STAGE.browse_file;
        break;
      case UPLOAD_STAGE.describe_db:
        this.stage = UPLOAD_STAGE.preview_file;
        break;
      case UPLOAD_STAGE.uploading:
        this.stage = UPLOAD_STAGE.uploading;
        break;
    }
  }
}
