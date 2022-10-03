import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DatabaseSchema, TableSchema } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { EtlOperator } from '@core/data-cook';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { ListUtils } from '@/utils';
import { cloneDeep } from 'lodash';

@Component({})
export default class SelectSource extends Vue {
  private loading = false;
  private keyword = '';
  private errorMsg = '';

  @Inject() protected readonly getAllNotGetOperators!: () => EtlOperator[];
  @Inject() protected readonly isLoadingOperator!: (operator: EtlOperator) => boolean;
  @Inject() protected readonly etlDbDisplayName!: string;

  @Prop({ type: Boolean, default: false })
  private hideHeader!: boolean;

  @Prop({ type: Boolean, default: false })
  private injectOperators!: boolean;

  private mounted() {
    this.$nextTick(() => {
      this.focus();
    });

    this.initSources();
  }

  private get allNotGetOperators(): EtlOperator[] {
    if (this.injectOperators && StringUtils.isIncludes(this.keyword, this.etlDbDisplayName)) {
      return this.getAllNotGetOperators().filter(operator => StringUtils.isIncludes(this.keyword, operator.destTableDisplayName || operator.destTableName));
    }
    return [];
  }

  async initSources() {
    if (this.loading) return;
    this.errorMsg = '';
    if (DatabaseSchemaModule.databaseInfos.length <= 0) {
      this.loading = true;
      await DatabaseSchemaModule.loadAllDatabaseInfos().catch(e => {
        this.errorMsg = e.message;
      });
    }
    if (!this.errorMsg && DatabaseSchemaModule.databaseSchemas.length < DatabaseSchemaModule.databaseInfos.length) {
      this.loading = true;
      await DatabaseSchemaModule.loadAllDatabaseSchemas().catch(e => {
        this.errorMsg = e.message;
      });
    }
    this.loading = false;
  }

  focus() {
    if (this.$refs.keyword) {
      (this.$refs.keyword as HTMLInputElement).focus();
    }
  }

  private get databaseSchemas(): DatabaseSchema[] {
    const databaseSchemas: DatabaseSchema[] = DatabaseSchemaModule.databaseSchemas ?? [];
    const result: DatabaseSchema[] = [];
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
  private selectTable(database: DatabaseSchema, table: TableSchema) {
    this.$emit('selectTable', database, table);
  }

  private selectOperator(operator: EtlOperator) {
    this.$emit('selectOperator', operator);
  }
}
