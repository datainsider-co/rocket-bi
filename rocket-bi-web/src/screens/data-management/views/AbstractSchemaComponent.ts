import { Component, Inject, InjectReactive, Vue } from 'vue-property-decorator';
import DatabaseTreeView from '@/screens/data-management/components/database-tree-view/DatabaseTreeView.vue';
import ChartContainer from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { SchemaReloadMode } from '@/store/modules/data-builder/DatabaseSchemaStore';

export interface FindSchemaResponse {
  database?: DatabaseInfo;
  table?: TableSchema;
  column?: Column;
}

@Component({
  components: {
    DatabaseTreeView,
    ChartContainer
  }
})
export default class AbstractSchemaComponent extends Vue {
  @InjectReactive('databaseSchemas')
  protected readonly databaseSchemas?: DatabaseInfo[];

  @InjectReactive('isDatabaseLoading')
  protected readonly isDatabaseLoading?: boolean;

  @Inject('findSchema')
  protected findSchema!: (databaseName?: string, tableName?: string, columnName?: string) => Promise<FindSchemaResponse>;

  @Inject('loadShortDatabaseInfos')
  protected readonly loadShortDatabaseInfos?: () => Promise<void>;

  @Inject('reloadShortDatabaseInfos')
  protected readonly reloadShortDatabaseInfos?: (reloadMode: SchemaReloadMode) => Promise<void>;

  @Inject('isExistDatabase')
  protected readonly isExistDatabase?: Function;
}
