import { SuggestionCommand } from '@/screens/DataIngestion/interfaces/SuggestionCommand';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { DatabaseInfo, SourceId } from '@core/domain';
// @ts-ignored
import SchemaService from '@/screens/DataIngestion/components/DiUploadDocument/services/SchemaService';

export class DatabaseSuggestionCommand implements SuggestionCommand {
  constructor(public sourceId: SourceId, public projectName = '', public location = '') {}

  load(): Promise<string[]> {
    return DataSourceModule.loadDatabaseNames({ id: this.sourceId, location: this.location, projectName: this.projectName });
  }
}

//suggest database with no parameter
export class DestDatabaseSuggestionCommand implements SuggestionCommand {
  load(): Promise<string[]> {
    return SchemaService.getListDatabase().then((resp: any) => {
      return resp.data.map((databaseInfo: DatabaseInfo) => {
        return databaseInfo.name;
      });
    });
  }
}
