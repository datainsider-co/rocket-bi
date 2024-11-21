import { SuggestionCommand } from '@/screens/data-ingestion/interfaces/SuggestionCommand';
import { SourceId } from '@core/common/domain';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';

export class IncrementalColumnSuggestionCommand implements SuggestionCommand {
  constructor(public sourceId: SourceId, public databaseName: string, public tableName: string, public projectName?: string, public location?: string) {}

  load(): Promise<string[]> {
    return DataSourceModule.loadIncrementalColumns({
      id: this.sourceId,
      dbName: this.databaseName,
      tblName: this.tableName,
      projectName: this.projectName,
      location: this.location
    });
  }
}
