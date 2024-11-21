import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { ShortDatabaseInfo, SourceId } from '@core/common/domain';
// @ts-ignored
import SchemaService from '@/screens/data-ingestion/components/di-upload-document/services/SchemaService';

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
      return resp.data.map((databaseInfo: ShortDatabaseInfo) => {
        return databaseInfo.name;
      });
    });
  }
}
