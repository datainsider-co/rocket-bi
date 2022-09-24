import { http } from './Common';
import { GetListDatabaseResp } from '../entities/Response';
import { Database } from '../entities/DocumentSchema';
import { Log } from '@core/utils';

const SchemaService = Object.freeze({
  getListDatabase() {
    return http()
      .get(`/databases`)
      .then(resp => {
        resp.currentFunctionData = new GetListDatabaseResp(resp).data;
        return resp;
      });
  },
  getDatabaseDetail(databaseName) {
    return http()
      .get(`/databases/${databaseName}`)
      .then(resp => {
        resp.currentFunctionData = new Database(resp.data);
        return resp;
      });
  },
  createDatabase(data) {
    return http()
      .post(`/databases?admin_secret_key=12345678`, data)
      .then(resp => {
        resp.currentFunctionData = new Database(resp.data);
        return resp;
      })
      .catch(e => {
        Log.debug(e);
      });
  }
});

export default SchemaService;
