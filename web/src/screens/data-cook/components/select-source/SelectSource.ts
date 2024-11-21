import { Component, Inject, Prop, Ref, Vue } from 'vue-property-decorator';
import { DatabaseInfo, TableSchema } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { EtlOperator } from '@core/data-cook';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { ListUtils } from '@/utils';
import { cloneDeep } from 'lodash';

@Component({})
export default class SelectSource extends Vue {
  private keyword = '';
  private errorMsg = '';

  @Inject() protected readonly getAllNotGetOperators!: () => EtlOperator[];
  @Inject() protected readonly isLoadingOperator!: (operator: EtlOperator) => boolean;
  @Inject() protected readonly etlDbDisplayName!: string;

  @Prop({ type: Boolean, default: false })
  private readonly hideHeader!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly injectOperators!: boolean;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly databaseInfos!: DatabaseInfo[];

  @Prop({ required: false, type: Object, default: () => ({}) })
  private readonly dbLoadingMap!: { [key: string]: boolean };

  @Prop({ required: false, type: Boolean, default: false })
  private readonly loading!: boolean;

  @Ref()
  protected readonly keywordInput!: HTMLInputElement;

  mounted() {
    this.$nextTick(() => {
      this.autoFocusInput();
    });

    // this.initDatabases();
  }

  protected get allNotGetOperators(): EtlOperator[] {
    if (this.injectOperators && StringUtils.isIncludes(this.keyword, this.etlDbDisplayName)) {
      return this.getAllNotGetOperators().filter(operator => StringUtils.isIncludes(this.keyword, operator.destTableDisplayName || operator.destTableName));
    }
    return [];
  }

  protected autoFocusInput() {
    if (this.keywordInput) {
      this.keywordInput.focus();
    }
  }

  protected get finalDatabaseInfos(): DatabaseInfo[] {
    const databaseSchemas: DatabaseInfo[] = this.databaseInfos ?? [];
    const result: DatabaseInfo[] = [];
    databaseSchemas.forEach(item => {
      if (StringUtils.isIncludes(this.keyword, item.displayName || item.name)) {
        result.push(item);
      } else {
        const foundTables = item.tables.filter(table => StringUtils.isIncludes(this.keyword, table.displayName || table.name));
        if (ListUtils.isNotEmpty(foundTables)) {
          const db = cloneDeep(item);
          db.setTables(foundTables);
          result.push(db);
        }
      }
    });

    return result;
  }

  @Track(TrackEvents.SelectTable, { database_name: (_: SelectSource, args: any) => args[0].name, table_name: (_: SelectSource, args: any) => args[1].name })
  private selectTable(database: DatabaseInfo, table: TableSchema) {
    this.$emit('selectTable', database, table);
  }

  private selectOperator(operator: EtlOperator) {
    this.$emit('selectOperator', operator);
  }
}
