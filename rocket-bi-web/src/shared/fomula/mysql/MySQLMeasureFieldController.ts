import { MySQLFormulaController } from '@/shared/fomula/mysql/MySQLFormulaController';
import { MySQLLanguage } from '@/shared/fomula/mysql/MySQLLanguageTokenizer';
import { TableSchema } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class MySQLMeasureFieldController extends MySQLFormulaController {
  tableSchema: TableSchema;

  constructor(allFunctions: FunctionInfo[], tableSchema: TableSchema) {
    super(allFunctions, []);
    this.tableSchema = tableSchema;
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...MySQLLanguage,
      fields: this.fieldNames()
    } as IMonarchLanguage);
  }

  private fieldNames(): string[] {
    return this.tableSchema.columns.map(col => col.displayName);
  }
}
