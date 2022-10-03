import { Component, Vue, InjectReactive, Inject } from 'vue-property-decorator';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import ChartContainer from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { Column, DatabaseSchema, TableSchema } from '@core/common/domain';

type FindSchemaResponse = {
  database?: DatabaseSchema;
  table?: TableSchema;
  column?: Column;
};

@Component({
  components: {
    DatabaseTreeView,
    ChartContainer
  }
})
export default class DataManagementChild extends Vue {
  @InjectReactive('databaseSchemas')
  protected readonly databaseSchemas?: DatabaseSchema[];

  @InjectReactive('loadingDatabaseSchemas')
  protected readonly loadingDatabaseSchemas?: boolean;

  @Inject('onInitedDatabaseSchemas')
  protected readonly onInitedDatabaseSchemas?: Function;

  @Inject('offInitedDatabaseSchemas')
  protected readonly offInitedDatabaseSchemas?: Function;

  @Inject('findSchema')
  protected findSchema?: (databaseName?: string, tableName?: string, columnName?: string) => FindSchemaResponse;

  @Inject('loadDatabases')
  protected readonly loadDatabases?: Function;

  @Inject('isExistDatabase')
  protected readonly isExistDatabase?: Function;
}
