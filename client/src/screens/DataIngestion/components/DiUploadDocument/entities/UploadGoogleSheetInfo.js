import { UPLOAD_STAGE } from '@/screens/DataIngestion/components/DiUploadDocument/entities/Enum';
import { DocumentSchema } from '@/screens/DataIngestion/components/DiUploadDocument/entities/DocumentSchema';
import { CSVSetting } from '@/screens/DataIngestion/components/DiUploadDocument/entities/CSVSetting';
import { GOOGLE_SHEET_DESC, GOOGLE_SHEET_TITLE } from './Enum';

export class UploadGoogleSheetInfo {
  constructor(stage) {
    this.stage = stage || UPLOAD_STAGE.browse_file;
    // this.chunkContainer = new ChunkContainerInfo(0);
    this.spreadsheetId = '';
    this.sheetId = '';
    this.sheetTitle = '';
    this.accessToken = '';
    this.refreshToken = '';
    this.authorizationCode = '';
    this.schema = new DocumentSchema();
    this.setting = new CSVSetting();
    this.registerInfo = null;
  }

  get title() {
    return GOOGLE_SHEET_TITLE[this.stage];
  }

  get desc() {
    return GOOGLE_SHEET_DESC[this.stage];
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
