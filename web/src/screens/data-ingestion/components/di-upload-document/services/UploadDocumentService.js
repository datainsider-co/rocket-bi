import { http } from './Common';
import { PreviewDocumentResp, RegisterDocumentResp } from '../entities/Response';

export default {
  get(csvId) {
    return http().get(`/ingestion/csv/${csvId}`);
  },
  preview(sampleData, csvSetting, schema) {
    const req = {
      sample: sampleData,
      csv_setting: csvSetting,
      schema
    };
    return http()
      .post('/ingestion/csv/preview', req)
      .then(resp => {
        resp.data = new PreviewDocumentResp(resp.data);
        return resp;
      });
  },
  register(data) {
    return http()
      .post('/ingestion/csv/register', data)
      .then(resp => {
        resp.data = new RegisterDocumentResp(resp.data);
        return resp;
      });
  },
  upload(data, onUploadProgress) {
    return http().post('/ingestion/csv/upload', data, {
      onUploadProgress
    });
  }
};
