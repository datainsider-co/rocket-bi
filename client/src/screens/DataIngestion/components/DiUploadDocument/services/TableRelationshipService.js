import { initHttpClient, config } from './Common';
import { Log } from '@core/utils';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import { DatabaseSchema, Field } from '@core/domain';
import { RelationshipInfo } from '@/screens/DashboardDetail/components/RelationshipModal';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';

const http = initHttpClient({
  baseURL: config.api
});

const TableRelationshipService = Object.freeze({
  getRelationships(databaseName, tableName) {
    return http.post(`/table_relationships`, { db_name: databaseName, tbl_name: tableName });
  },
  putTableRelationship(data) {
    return http.put(`/table_relationships/update`, data);
  },
  getGlobalRelationship() {
    return (
      http.get <
      RelationshipInfo >
      `/relationship/global`.then(response => {
        const columns = response.views.map(view => {
          const schema = DatabaseSchemaModule.getTableSchema();
        });
      })
    );
  }
});

export default TableRelationshipService;
