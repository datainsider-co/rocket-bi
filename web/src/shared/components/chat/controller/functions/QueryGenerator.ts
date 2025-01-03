import { Di } from '@core/common/modules';
import { Log } from '@core/utils';
import { ListUtils, PopupUtils, StringUtils } from '@/utils';
import { DatabaseInfo, DIException } from '@core/common/domain';
import { PromptEvents, QueryEditorEvents } from '@/shared/enums/PromptEvents';
import { QueryUtils } from '@/screens/data-management/views/query-editor/QueryUtils';
import EventBus from '@/shared/components/chat/helpers/EventBus';
import { ChatbotController } from '@/shared/components/chat/controller/ChatbotController';
import { ShortInfoDatabaseSchema, TableSchemaPicker } from '@/shared/components/chat/controller/functions/TableSchemaPicker';
import { ClickhouseSQLFunction } from '@/shared/components/chat/controller/functions/ClickhouseSQLFunction';

export class QueryGenerator {
  async process(prompt: string, databases: DatabaseInfo[]): Promise<string> {
    try {
      this.ensureDatabases(databases);
      const selectedDatabase: ShortInfoDatabaseSchema = this.selectDatabase(databases[0]!);
      const sqlQuery = await this.executeSqlFunction(prompt, selectedDatabase);
      this.emitAppendTextEvent(sqlQuery);
      return sqlQuery;
    } catch (ex) {
      this.handleError(ex);
      throw ex;
    } finally {
      EventBus.$emit(PromptEvents.analyzePromptCompleted);
    }
  }

  private selectDatabase(database: DatabaseInfo): ShortInfoDatabaseSchema {
    EventBus.$emit(PromptEvents.analyzingPrompt);
    return TableSchemaPicker.normalizeDatabase(database);
  }

  private async executeSqlFunction(prompt: string, selectedDatabase: ShortInfoDatabaseSchema): Promise<string> {
    const chatbotController = Di.get(ChatbotController);
    const clickhouseSql = new ClickhouseSQLFunction(chatbotController);
    const sqlQuery = await clickhouseSql.execute(prompt, selectedDatabase);
    Log.debug('QueryGenerator::process::sqlQuery::', sqlQuery);
    return sqlQuery;
  }

  private emitAppendTextEvent(sqlQuery: string) {
    EventBus.$emit(QueryEditorEvents.appendText, sqlQuery);
  }

  private handleError(ex: any) {
    Log.error('QueryGenerator::process', ex);
    const message = DIException.fromObject(ex).getPrettyMessage();
    PopupUtils.showError(message);
  }

  private ensureDatabases(databases: DatabaseInfo[]) {
    if (ListUtils.isEmpty(databases)) {
      throw new DIException('Database is required!');
    }
  }

  static shouldProcessQuery(query: string): boolean {
    const existAICommand = QueryUtils.hasAICommand(query);
    const emptyStringBelowCommand = StringUtils.isEmpty(QueryUtils.getTextAfterAICommand(query));
    return existAICommand && emptyStringBelowCommand;
  }
}
