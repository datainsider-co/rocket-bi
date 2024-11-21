/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import { DatabaseInfo, Field, TableSchema } from '@core/common/domain/model';
import QueryComponent from '@/screens/data-management/components/QueryComponent.vue';
import QueryComponentCtrl from '@/screens/data-management/components/QueryComponent.ts';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { FormulaSuggestionModule, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { StringUtils } from '@/utils/StringUtils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { EditorController } from '@/shared/fomula/EditorController';
import { DatabaseListingMode } from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing';
import { EtlQueryLanguages } from '@core/data-cook';
import DiButtonGroup from '@/shared/components/common/DiButtonGroup.vue';
import { PythonFormulaController } from '@/shared/fomula/python/PythonFormulaController';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils';
import { Di } from '@core/common/modules';
import { FormulaControllerFactoryResolver } from '@/shared/fomula/builder/FormulaControllerFactoryResolver';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';

Vue.use(BuilderComponents);
@Component({
  components: {
    DatabaseListing,
    QueryComponent,
    DiButtonGroup
  }
})
export default class QueryBuilder extends Vue {
  protected isDragging = false;
  protected controller: MonacoFormulaController | null = null;
  protected defaultQuery = '';
  protected readonly DatabaseListingMode = DatabaseListingMode;

  protected readonly editorController = new EditorController();

  @Prop({ required: true, type: Object })
  protected readonly databaseSchema!: DatabaseInfo;

  @Prop({ required: false, type: String, default: '' })
  protected readonly query?: string;
  @Prop({ required: false, type: String, default: EtlQueryLanguages.SQL })
  protected readonly queryLanguage!: EtlQueryLanguages;

  @Prop({ required: false, type: Boolean, default: true })
  protected readonly showParameter!: boolean;

  @Ref()
  protected readonly queryComponent!: QueryComponentCtrl;

  @Ref()
  protected readonly buttonGroup!: DiButtonGroup;

  created() {
    this.initFormulaController(this.databaseSchema, this.queryLanguage);
    this.autoSelectTable();
    if (StringUtils.isNotEmpty(this.query)) {
      this.defaultQuery = this.removeDatabase(this.query, this.databaseSchema.name);
    }
  }

  @Watch('queryLanguage')
  onQueryLanguageChanged() {
    this.initFormulaController(this.databaseSchema, this.queryLanguage);
  }

  @Watch('query')
  onQueryChanged() {
    this.defaultQuery = this.removeDatabase(this.query ?? '', this.databaseSchema.name);
  }

  protected removeDatabase(query: string, dbName: string): string {
    const newQuery: string = query.replaceAll(new RegExp(`(?:\\b${dbName}.\\b)|(?:\`${dbName}\`.)`, 'gm'), '');
    return newQuery;
  }

  beforeDestroy() {
    DatabaseSchemaModule.removeDatabaseInfo(this.databaseSchema.name);
  }

  protected autoSelectTable(): void {
    _BuilderTableSchemaStore.setDbNameSelected(this.databaseSchema.name);
    _BuilderTableSchemaStore.setDatabaseSchema(this.databaseSchema);
    _BuilderTableSchemaStore.expandFirstTable();
  }

  @Emit('onCancel')
  protected async handleCancel() {
    return true;
  }

  protected initFormulaController(database: DatabaseInfo, queryLanguage: EtlQueryLanguages): void {
    switch (queryLanguage) {
      case EtlQueryLanguages.SQL:
        this.initSqlFormulaController(database);
        break;
      case EtlQueryLanguages.Python:
        this.initPythonFormulaController(database);
        break;
      default:
        Log.error('Not support query language');
        PopupUtils.showError(`Not support query language ${queryLanguage}`);
    }
  }

  protected initSqlFormulaController(database: DatabaseInfo): void {
    const factory = Di.get(FormulaControllerFactoryResolver).resolve(ConnectionModule.sourceType);
    FormulaSuggestionModule.loadSuggestions({
      supportedFunctionInfo: factory.getSupportedFunctionInfo()
    });
    this.controller = factory.createFormulaController(FormulaSuggestionModule.allFunctions, [database]);
  }

  protected initPythonFormulaController(database: DatabaseInfo): void {
    FormulaSuggestionModule.loadSuggestions({
      supportedFunctionInfo: SupportedFunctionInfo.empty()
    });
    this.controller = new PythonFormulaController([database]);
  }

  /**
   * add database name to query if not exist
   */
  protected convertQuery(query: string): string {
    let newQuery = query ?? '';
    this.databaseSchema.tables.forEach(table => {
      newQuery = FormulaUtils.toETLQuery(newQuery, table.dbName, table.name);
    });
    return newQuery;
  }

  getQuery(): string {
    return this.queryComponent.currentQuery;
  }

  protected handleClickField(field: Field) {
    const query = FormulaUtils.toQuery(field.fieldName);
    this.editorController.appendText(query);
  }

  protected handleClickTable(table: TableSchema) {
    const query = FormulaUtils.toQuery(table.dbName, table.name);
    this.editorController.appendText(query);
  }

  protected getDisplayName(language: EtlQueryLanguages): string {
    switch (language) {
      case EtlQueryLanguages.SQL:
        return 'Query';
      case EtlQueryLanguages.Python:
        return 'Python';
    }
  }
}
