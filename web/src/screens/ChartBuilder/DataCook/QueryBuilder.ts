/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/DatabaseListing.vue';
import { DatabaseSchema, Field, TableSchema } from '@core/domain/Model';
import QueryComponent from '@/screens/DataManagement/components/QueryComponent.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { FormulaSuggestionModule } from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/FormulaSuggestionStore';
import { EtlQueryFormulaController } from '@/shared/fomula/EtlQueryFormulaController';
import { StringUtils } from '@/utils/string.utils';
import { _BuilderTableSchemaStore } from '@/store/modules/data_builder/BuilderTableSchemaStore';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { EditorController } from '@/shared/fomula/EditorController';
import { DatabaseListingMode } from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/DatabaseListing';
import { Log } from '@core/utils';

Vue.use(BuilderComponents);
@Component({
  components: {
    DatabaseListing,
    QueryComponent
  }
})
export default class QueryBuilder extends Vue {
  private isDragging = false;
  private controller: FormulaController | null = null;
  private defaultQuery = '';
  private readonly DatabaseEditionMode = DatabaseListingMode;

  private readonly editorController = new EditorController();

  @Prop({ required: true })
  private readonly tableSchema!: TableSchema;

  @Prop({ required: false, type: String, default: '' })
  private readonly query?: string;

  @Ref()
  private readonly queryComponent!: QueryComponent;

  created() {
    this.initFormulaController(this.tableSchema);
    this.selectTable(this.tableSchema);
    if (StringUtils.isNotEmpty(this.query)) {
      this.defaultQuery = this.removeDatabase(this.query, this.tableSchema);
    }
  }

  private removeDatabase(query: string, tableSchema: TableSchema): string {
    const dbName = tableSchema.dbName;
    return query.replaceAll(new RegExp(`(?:\\b${dbName}.\\b)|(?:\`${dbName}\`.)`, 'gm'), '');
  }

  beforeDestroy() {
    DatabaseSchemaModule.removeDatabaseSchema(this.tableSchema.dbName);
  }

  private async selectTable(tableSchema: TableSchema) {
    const databaseSchema = DatabaseSchema.etlDatabase(tableSchema.dbName, 'Table & Field', [this.tableSchema]);
    _BuilderTableSchemaStore.setDbNameSelected(databaseSchema.name);
    _BuilderTableSchemaStore.setDatabaseSchema(databaseSchema);
    _BuilderTableSchemaStore.expandFirstTable();
  }

  @Emit('onCancel')
  private async handleCancel() {
    return true;
  }

  private initFormulaController(tableSchema: TableSchema) {
    FormulaSuggestionModule.initSuggestFunction({
      fileNames: ['clickhouse_syntax.json']
    });
    const database = DatabaseSchema.etlDatabase(tableSchema.dbName, 'ETL Database', [tableSchema]);
    this.controller = new EtlQueryFormulaController(FormulaSuggestionModule.allFunctions, [database]);
  }

  private convertQuery(query: string): string {
    return FormulaUtils.toETLQuery(query, this.tableSchema.dbName, this.tableSchema.name);
  }

  getQuery(): string {
    return this.queryComponent.currentQuery;
  }

  private handleClickField(field: Field) {
    const query = FormulaUtils.toQuery(field.fieldName);
    this.editorController.appendText(query);
  }

  private handleClickTable(table: TableSchema) {
    const query = FormulaUtils.toQuery(table.dbName, table.name);
    this.editorController.appendText(query);
  }
}
