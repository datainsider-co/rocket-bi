import deneric from 'deneric';
import { Database, DocumentSchema } from './DocumentSchema';

// import { CSVSetting } from './CSVSetting'

export class PreviewDocumentResp extends deneric.Entity {
  constructor(data) {
    super(data, {
      records: ['records', deneric.Array],
      schema: ['schema', DocumentSchema]
    });
  }
}

export class RegisterDocumentResp extends deneric.Entity {
  constructor(data) {
    super(data, {
      id: ['id', deneric.String]
    });
  }
}

export class GetListDatabaseResp extends deneric.Entity {
  constructor(data) {
    super(data, {
      data: ['data', [Database]]
    });
  }
}

//
// export class RegisterDocumentReq extends deneric.Entity {
//   constructor(data) {
//     super(data, {
//       file_name: ['file_name', deneric.String],
//       batch_size: ['batch_size', deneric.Number],
//       schema: ['schema', DocumentSchema],
//       csv_setting: ['csv_setting', CSVSetting]
//     })
//   }
// }
//
// export class UploadDocumentReq extends deneric.Entity {
//   constructor(data) {
//     super(data, {
//       'csv_id': ['csv_id', deneric.String],
//       'batch_number': ['batch_number', deneric.Number],
//       'data': ['data', deneric.String],
//       'is_end': ['is_end', deneric.Boolean]
//     })
//   }
// }
