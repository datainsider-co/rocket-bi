<template>
  <div class="section">
    <DiToggle id="toggle-sync-to-warehouse" :value.sync="dataWareHouse.enable" label="Data WareHouse"></DiToggle>
    <!-- Data warehouse Config -->
    <b-collapse id="data-warehouse-config" v-model="dataWareHouse.enable" class="mb-2">
      <DestDatabaseSuggestion
        id="di-dest-database-selection"
        :databaseName="dataWareHouse.database"
        :labelWidth="0.001"
        :tableName="dataWareHouse.table"
        class="database-suggestion-form"
        @changeDatabase="handleDestDatabaseChange"
        @changeTable="handleDestTableChange"
        @submit="emitSubmit"
      />
      <div class="d-flex flex-row align-items-center align-content-center">
        <div class="title mb-0 mr-3">Save mode</div>
        <SingleChoiceItem :is-selected="saveAsAppend" :item="saveModes[0]" class="mr-3" @onSelectItem="handleSelectSave" />
        <SingleChoiceItem :is-selected="!saveAsAppend" :item="saveModes[1]" @onSelectItem="handleSelectSave" />
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue, Watch } from 'vue-property-decorator';
import { WareHouseUIConfig } from '@/screens/lake-house/views/job/WareHouseUIConfig';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import LakeHouseOutputForm from '@/screens/lake-house/views/job/output-form/LakeHouseConfig.vue';
import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import { WriteMode } from '@core/lake-house';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DatabaseCreateRequest, DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { SelectOption } from '@/shared';
import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import DiToggle from '@/shared/components/common/DiToggle.vue';

@Component({ components: { DiToggle, LakeHouseOutputForm, SingleChoiceItem, DestDatabaseSuggestion } })
export default class WareHouseConfig extends Vue {
  private readonly saveModes: SelectOption[] = [
    { displayName: 'Append', id: WriteMode.Append },
    { displayName: 'Replace', id: WriteMode.Replace }
  ];
  @PropSync('wareHouseConfig', { default: WareHouseUIConfig.default() })
  private dataWareHouse!: WareHouseUIConfig;

  @Inject
  private readonly schemaService!: SchemaService;

  private isCreateNewDatabase = false;
  private isCreateNewTable = false;

  private get saveAsAppend(): boolean {
    return this.dataWareHouse.saveMode === WriteMode.Append;
  }

  async toOutput(): Promise<ResultOutput | undefined> {
    return this.getOrCreateDatabase()
      .then(() => this.dataWareHouse.toOutputInfo())
      .catch(ex => {
        Log.error(ex);
        throw new DIException(ex);
      });
  }

  private async getOrCreateDatabase(): Promise<void> {
    //get db & get/create table
    if (!this.isCreateNewDatabase) {
      return;
    } else {
      //create db but not create table
      if (this.dataWareHouse.database) {
        return this.createDatabase(this.dataWareHouse.database);
      }
    }
  }

  private async createDatabase(database: string): Promise<void> {
    const dbCreationRequest = new DatabaseCreateRequest(database, database);
    const databaseInfo = await this.schemaService.createDatabase(dbCreationRequest);
    this.dataWareHouse.database = databaseInfo.name;
  }

  private handleDestDatabaseChange(newName: string, isCreateNew: boolean) {
    this.dataWareHouse.database = StringUtils.toSnakeCase(newName);
    this.isCreateNewDatabase = isCreateNew;
  }

  private handleDestTableChange(newName: string, isCreateNew: boolean) {
    this.dataWareHouse.table = StringUtils.toSnakeCase(newName);
    this.isCreateNewTable = isCreateNew;
  }

  private handleSelectSave(item: SelectOption) {
    this.dataWareHouse.saveMode = item.id as WriteMode;
    TrackingUtils.track(TrackEvents.WarehouseSelectSaveMode, { mode: item.id });
  }

  private emitSubmit() {
    this.$emit('submit');
  }
}
</script>

<style lang="scss">
#data-warehouse-config {
  .new-db-input,
  .new-table-input {
    padding: 12px;
    height: 40px;
  }
}

.database-suggestion-form {
  margin-bottom: 8px;

  .form-group {
    margin-bottom: 0 !important;

    label {
      display: none;
    }

    > div {
      width: 100%;
    }

    .select-container {
      width: unset;
    }
  }
}
</style>
