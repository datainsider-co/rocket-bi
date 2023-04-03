/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 5:16 PM
 */

import { Component, Emit, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import BuilderComponents from '@/shared/components/builder';
import DatabaseListing from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing.vue';
import { DatabaseSchema, Field, TableSchema } from '@core/common/domain/model';
import QueryComponent from '@/screens/data-management/components/QueryComponent.vue';
import QueryComponentCtrl from '@/screens/data-management/components/QueryComponent.ts';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { FormulaSuggestionModule } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { EtlQueryFormulaController } from '@/shared/fomula/EtlQueryFormulaController';
import { StringUtils } from '@/utils/StringUtils';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { EditorController } from '@/shared/fomula/EditorController';
import { DatabaseListingMode } from '@/screens/chart-builder/config-builder/database-listing/DatabaseListing';
import { EtlQueryLanguages } from '@core/data-cook';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import Swal from 'sweetalert2';
import { PythonFormulaController } from '@/shared/fomula/python/PythonFormulaController';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

Vue.use(BuilderComponents);
@Component({
  components: {
    DatabaseListing,
    QueryComponent,
    DiButtonGroup
  }
})
export default class QueryBuilder extends Vue {
  private isDragging = false;
  private controller: FormulaController | null = null;
  private defaultQuery = '';
  private readonly DatabaseEditionMode = DatabaseListingMode;

  private readonly editorController = new EditorController();

  @Prop({ required: true, type: Object })
  private readonly databaseSchema!: DatabaseSchema;

  @Prop({ required: false, type: String, default: '' })
  private readonly query?: string;
  @Prop({ required: false, type: String, default: EtlQueryLanguages.ClickHouse })
  private readonly queryLanguage!: EtlQueryLanguages;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly showParameter!: boolean;

  @Ref()
  private readonly queryComponent!: QueryComponentCtrl;

  @Ref()
  private readonly buttonGroup!: DiButtonGroup;

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

  private removeDatabase(query: string, dbName: string): string {
    const newQuery: string = query.replaceAll(new RegExp(`(?:\\b${dbName}.\\b)|(?:\`${dbName}\`.)`, 'gm'), '');
    return newQuery;
  }

  beforeDestroy() {
    DatabaseSchemaModule.removeDatabaseSchema(this.databaseSchema.name);
  }

  private autoSelectTable(): void {
    _BuilderTableSchemaStore.setDbNameSelected(this.databaseSchema.name);
    _BuilderTableSchemaStore.setDatabaseSchema(this.databaseSchema);
    _BuilderTableSchemaStore.expandFirstTable();
  }

  @Emit('onCancel')
  private async handleCancel() {
    return true;
  }

  private initFormulaController(database: DatabaseSchema, queryLanguage: EtlQueryLanguages): void {
    const syntaxPathFile: string = this.getSyntaxPath(queryLanguage);
    FormulaSuggestionModule.initSuggestFunction({
      fileNames: StringUtils.isNotEmpty(syntaxPathFile) ? [syntaxPathFile] : []
    });
    this.controller = this.getFormulaController(queryLanguage, [database]);
  }

  private getFormulaController(queryLanguage: EtlQueryLanguages, databases: DatabaseSchema[]): FormulaController {
    switch (queryLanguage) {
      case EtlQueryLanguages.ClickHouse:
        return new EtlQueryFormulaController(FormulaSuggestionModule.allFunctions, databases);
      case EtlQueryLanguages.Python:
        return new PythonFormulaController(databases);
    }
  }

  private getSyntaxPath(queryLanguage: EtlQueryLanguages): string {
    switch (queryLanguage) {
      case EtlQueryLanguages.ClickHouse:
        return 'clickhouse-syntax.json';
      case EtlQueryLanguages.Python:
        return '';
    }
  }

  /**
   * add database name to query if not exist
   */
  private convertQuery(query: string): string {
    let newQuery = query ?? '';
    this.databaseSchema.tables.forEach(table => {
      newQuery = FormulaUtils.toETLQuery(newQuery, table.dbName, table.name);
    });
    return newQuery;
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

  private get queryLanguageOptions(): ButtonInfo[] {
    return [
      {
        displayName: this.getDisplayName(EtlQueryLanguages.ClickHouse),
        isActive: this.queryLanguage === EtlQueryLanguages.ClickHouse,
        onClick: () => this.setQueryLanguage(this.queryLanguage, EtlQueryLanguages.ClickHouse)
      },
      {
        displayName: this.getDisplayName(EtlQueryLanguages.Python),
        isActive: this.queryLanguage === EtlQueryLanguages.Python,
        onClick: () => this.setQueryLanguage(this.queryLanguage, EtlQueryLanguages.Python)
      }
    ];
  }

  async setQueryLanguage(oldLanguage: EtlQueryLanguages, language: EtlQueryLanguages) {
    if (StringUtils.isNotEmpty(this.query)) {
      const response = await Swal.fire({
        icon: 'question',
        title: 'Change language',
        html: `Are you sure to change to <strong>${this.getDisplayName(language)}</strong>?`,
        showLoaderOnConfirm: true,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Yes'
      });
      Log.debug('setQueryLanguage::', response);
      if (response.isConfirmed) {
        this.$emit('selectLanguage', language);
      } else if (response.isDismissed || response.isDenied) {
        this.buttonGroup.active(this.getDisplayName(oldLanguage));
      }
    } else {
      this.$emit('selectLanguage', language);
    }
  }

  private getDisplayName(language: EtlQueryLanguages): string {
    switch (language) {
      case EtlQueryLanguages.ClickHouse:
        return 'Query';
      case EtlQueryLanguages.Python:
        return 'Python';
    }
  }
}
