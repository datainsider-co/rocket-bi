<template>
  <div>
    <vue-context ref="dbFieldContext">
      <template>
        <StatusWidget :error="errorMsg" :status="status">
          <div class="context field-context">
            <template v-if="fieldOptionsList.length === 0">
              <div class="d-flex align-items-center justify-content-center" style="height:  316px;width:250px">
                <EmptyDirectory :is-hide-create-hint="true" title="Database empty" />
              </div>
            </template>
            <template v-for="(table, tableIndex) in fieldOptionsList" v-else>
              <li :key="`table_${tableIndex}`" class="p-2">
                <b href="#">{{ table.displayName }}</b>
              </li>
              <template v-for="(field, i) in table.options">
                <div :key="`table_${tableIndex}_${i}`" class="active p-2" @click="handleSelectColumn(field)">
                  <li class="px-2 overflow-hidden" style="white-space: nowrap; text-overflow: ellipsis">
                    <a href="#" style="cursor: pointer">{{ field.displayName }}</a>
                  </li>
                </div>
              </template>
            </template>
          </div>
        </StatusWidget>
      </template>
    </vue-context>

    <vue-context ref="fieldContext">
      <template v-if="child.data" slot-scope="child">
        <StatusWidget :error="errorMsg" :status="status">
          <div class="context field-context">
            <template v-if="isEmpty(fieldInfoList)">
              <div>
                <li>
                  <a href="#">No fields available</a>
                </li>
              </div>
            </template>
            <template v-else>
              <div v-for="(fieldDetailInfo, i) in fieldInfoList" :key="i" class="active" @click.prevent="handleChangeField(child, fieldDetailInfo)">
                <li>
                  <a href="#" style="cursor: pointer">{{ fieldDetailInfo.displayName }}</a>
                  <span v-if="child.data.node.displayName === fieldDetailInfo.displayName">&#10003;</span>
                </li>
              </div>
            </template>
          </div>
        </StatusWidget>
      </template>
    </vue-context>
    <vue-context ref="controlContext">
      <template v-if="child.data" slot-scope="child">
        <StatusWidget :error="errorMsg" :status="status">
          <div class="context field-context">
            <template v-if="isEmpty(chartControlList)">
              <div>
                <li>
                  <a href="#">No chart controls available</a>
                </li>
              </div>
            </template>
            <template v-else>
              <div v-for="(fieldDetailInfo, i) in chartControlList" :key="i" class="active" @click.prevent="handleChangeField(child, fieldDetailInfo)">
                <li>
                  <a href="#" style="cursor: pointer">{{ fieldDetailInfo.displayName }}</a>
                </li>
              </div>
            </template>
          </div>
        </StatusWidget>
      </template>
    </vue-context>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { FunctionTreeNode, Status } from '@/shared';
import { ChartControlField, DatabaseInfo, Field, FieldDetailInfo, ChartControl } from '@core/common/domain';
import { HtmlElementRenderUtils, ListUtils, SchemaUtils, TimeoutUtils } from '@/utils';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { ContextData } from '@/screens/chart-builder/config-builder/config-panel/ConfigDraggable';
import VueContext from 'vue-context';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { WidgetModule } from '@/screens/dashboard-detail/stores';

@Component({
  components: {
    VueContext,
    EmptyDirectory
  }
})
export default class SelectFieldContext extends Vue {
  private errorMsg = '';
  private status = Status.Loading;
  private fieldOptionsList: DropdownData[] = [];

  private fieldInfoList: FieldDetailInfo[] = [];
  private chartControlList: FieldDetailInfo[] = [];

  private selectedNode: FunctionTreeNode | null = null;

  private currentDatabase: DatabaseInfo | null = _BuilderTableSchemaStore.databaseSchema;

  @Ref()
  private readonly dbFieldContext!: any;

  @Ref()
  private readonly fieldContext!: any;

  @Ref()
  private readonly controlContext!: any;

  private isEmpty(list: any[]) {
    return ListUtils.isEmpty(list);
  }

  handleSelectColumn(field: any) {
    this.$emit('select-column', field);
  }

  async showSuggestFields(event: any, data: ContextData['data']) {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.fieldContext.open(event, data);
      },
      100
    );
    this.initSuggestFields(data);
  }

  private async initSuggestFields(data: ContextData['data']) {
    try {
      this.status = Status.Loading;
      this.selectedNode = data.node;
      if (this.selectedNode && this.selectedNode.field) {
        this.currentDatabase = await this.loadDatabaseSchema(this.selectedNode.field.dbName);
        this.renderSuggestFields(this.currentDatabase!, this.selectedNode.field.tblName);
      }
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('SelectFieldContext::suggestFields', ex);
      this.status = Status.Error;
      this.errorMsg = 'Can not suggest fields';
    }
  }

  private async loadDatabaseSchema(dbName: string): Promise<DatabaseInfo> {
    if (dbName === _BuilderTableSchemaStore.databaseSchema?.name) {
      return _BuilderTableSchemaStore.databaseSchema!;
    } else {
      const databaseSchema = await DatabaseSchemaModule.fetchDatabaseInfo(dbName);
      return databaseSchema;
    }
  }

  private renderSuggestFields(databaseSchema: DatabaseInfo, tblName: string) {
    const currentTable = databaseSchema.tables.find(table => table.name === tblName);
    if (currentTable) {
      this.fieldInfoList = currentTable.columns.map(column => {
        return new FieldDetailInfo(
          Field.new(currentTable.dbName, currentTable.name, column.name, column.className),
          column.name,
          column.displayName,
          SchemaUtils.isNested(currentTable.name),
          false
        );
      });
    } else {
      this.fieldInfoList = [];
    }
  }

  private async initTablesOptions(dbName: string): Promise<void> {
    try {
      this.status = Status.Loading;
      const databaseSchema: DatabaseInfo = await this.loadDatabaseSchema(dbName);
      this.fieldOptionsList = SchemaUtils.toFieldDetailInfoOptions(cloneDeep(databaseSchema));
      this.status = Status.Loaded;
    } catch (ex) {
      this.status = Status.Error;
      this.errorMsg = "Can't find tables of this database";
    }
  }

  showTableAndFields(event: Event): void {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.dbFieldContext.open(event);
      },
      100
    );
    const dbName = _BuilderTableSchemaStore.selectedDbName;
    this.initTablesOptions(dbName);
  }

  showSuggestChartControls(event: MouseEvent, data: ContextData['data']): void {
    TimeoutUtils.waitAndExec(
      null,
      () => {
        this.controlContext.open(event, data);
      },
      100
    );
    this.initChartControls();
  }

  private async initChartControls() {
    try {
      this.status = Status.Loading;
      // const chartControllers: ChartController[] = WidgetModule.chartControllers;
      // _BuilderTableSchemaStore.setChartControls(chartControllers);
      this.chartControlList = _BuilderTableSchemaStore.chartControlAsTreeNodes.map(control => {
        const controlData = ConfigDataUtils.getTabControlData(control as any);
        return new FieldDetailInfo(new ChartControlField(controlData!), control.title, control.title, false, false);
      });
      this.status = Status.Loaded;
    } catch (ex) {
      Log.error('SelectFieldContext::initChartControls', ex);
      this.status = Status.Error;
      this.errorMsg = 'Can not suggest chart controls';
    }
  }

  private handleChangeField(child: any, profileField: FieldDetailInfo) {
    this.$emit('field-changed', child, profileField);
  }
}
</script>
