import { DatabaseSchema } from '@core/common/domain/model';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { EtlCompletionItemProvider } from '@/shared/fomula/clickhouse/EtlCompletionItemProvider';

export class EtlQueryFormulaController extends QueryFormulaController {
  constructor(allFunctions: FunctionInfo[], databaseSchemas: DatabaseSchema[] = []) {
    super(allFunctions, databaseSchemas);
  }

  formulaName(): string {
    return 'di-etl-query';
  }

  getTheme(themeType: 'light' | 'dark' | 'custom'): string {
    return `etl-query-theme-${themeType}`;
  }

  protected loadSuggestion(monaco: any) {
    this.languageRegister = monaco.languages.registerCompletionItemProvider(
      this.formulaName(),
      new EtlCompletionItemProvider({
        ...this,
        language: this.formulaName(),
        triggerCharacters: ['.', '(', ',', '`', '[', ' ']
      } as any)
    );
  }
}
