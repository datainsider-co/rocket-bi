import deneric from 'deneric';
import { DocumentSchema } from './DocumentSchema';
import { CSVSetting } from './CSVSetting';

export class PreviewDocumentReq extends deneric.Entity {
  constructor(data) {
    super(data, {
      sample: ['sample', deneric.Array],
      schema: ['schema', DocumentSchema],
      csv_setting: ['csv_setting', CSVSetting]
    });
  }
}

export class RegisterDocumentReq extends deneric.Entity {
  constructor(data) {
    super(data, {
      file_name: ['file_name', deneric.String],
      batch_size: ['batch_size', deneric.Number],
      schema: ['schema', DocumentSchema],
      csv_setting: ['csv_setting', CSVSetting]
    });
  }
}

export class UploadDocumentReq extends deneric.Entity {
  constructor(data) {
    super(data, {
      csv_id: ['csv_id', deneric.String],
      batch_number: ['batch_number', deneric.Number],
      data: ['data', deneric.String],
      is_end: ['is_end', deneric.Boolean]
    });
  }
}
