import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { Column, SourceId } from '@core/common/domain';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
// @ts-ignored
import SchemaService from '@/screens/data-ingestion/components/di-upload-document/services/SchemaService';
import { Log } from '@core/utils';

export class TableSuggestionCommand implements SuggestionCommand {
  constructor(public sourceId: SourceId, public databaseName: string, public projectName = '', public location = '') {}

  load(): Promise<string[]> {
    return DataSourceModule.loadTableNames({ id: this.sourceId, dbName: this.databaseName, projectName: this.projectName, location: this.location });
  }
}

export class DestTableSuggestionCommand implements SuggestionCommand {
  constructor(public databaseName: string) {}

  load(): Promise<string[]> {
    return SchemaService.getDatabaseDetail(this.databaseName).then((dataResponse: any) => {
      Log.debug('tableNames::', dataResponse.data);
      return dataResponse.data.tables.map((tableSchema: Column) => {
        return tableSchema.name;
      });
    });
  }
}
