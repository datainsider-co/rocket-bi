<template>
  <EtlModal
    class="save-to-database"
    ref="modal"
    @submit="submit"
    @hidden="resetModel"
    :loading="loading"
    :actionName="actionName"
    title="Save To Database"
    :width="480"
  >
    <form @submit.prevent="submit" v-if="model" class=" save-to-db">
      <vuescroll :ops="scrollConfig">
        <div class="scroll-body">
          <div class="mar-b-12">
            <div class="title mar-b-12">Select the type of database to save</div>
            <DiDropdown
              id="cook-database-type"
              v-model="selectedDatabaseType"
              :data="databaseTypes"
              labelProps="label"
              valueProps="value"
              boundary="viewport"
            ></DiDropdown>
          </div>
          <template v-if="isOracleJdbcPersist">
            <OracleSourceInfo class="persist-configuration-info" :persist-config.sync="model" />
            <DestConfigurationForm
              class="database-table-selection"
              ref="oracleJdbcPersistDatabaseTableSelection"
              :loading="loading"
              :oracle-jdbc-persist-configuration.sync="model"
            />
          </template>
          <template v-if="isMySQLPersist">
            <MySQLSourceInfo class="persist-configuration-info" :my-sql-jdbc-persist-configuration.sync="model" />
            <MySQLDestConfigForm
              class="database-table-selection"
              ref="mySQLDestConfigForm"
              :loading="loading"
              :my-sql-jdbc-persist-configuration.sync="model"
            />
          </template>
          <template v-if="isPostgresPersist">
            <PostgresSourceInfo class="persist-configuration-info" :postgres-jdbc-persist-configuration.sync="model" />
            <postgres-dest-config-form
              class="database-table-selection"
              ref="postgresDestConfigForm"
              :loading="loading"
              :postgres-jdbc-persist-configuration.sync="model"
            />
          </template>
          <template v-if="isMsSQLPersist">
            <MsSQLSourceInfo class="persist-configuration-info" :ms-sql-jdbc-persist-configuration.sync="model" />
            <MsSQLDestConfigForm
              class="database-table-selection"
              ref="msSQLDestConfigForm"
              :loading="loading"
              :ms-sql-jdbc-persist-configuration.sync="model"
            />
          </template>
          <template v-if="isVerticaPersist">
            <VerticaSourceInfo class="persist-configuration-info" :configuration.sync="model" />
            <VerticaDestConfigForm class="database-table-selection" ref="verticaDestConfigForm" :loading="loading" :configuration.sync="model" />
          </template>
          <input type="submit" class="d-none" />
        </div>
      </vuescroll>
    </form>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { EtlOperator, PERSISTENT_TYPE } from '@core/DataCook';
import { TableSchema } from '@core/domain';
import SelectDatabaseAndTable from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import OracleSourceInfo from '@/screens/DataCook/components/SaveToDatabase/OracleSourceForm/OracleSourceInfo.vue';
import DestConfigurationForm from '@/screens/DataCook/components/SaveToDatabase/OracleSourceForm/DestConfigurationForm.vue';
import { Log } from '@core/utils';
import { ThirdPartyPersistConfigurations } from '@core/DataCook/Domain/ETL';
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';
import { VerticalScrollConfigs } from '@/shared';
import MySQLSourceInfo from '@/screens/DataCook/components/SaveToDatabase/MySQLSourceForm/MySQLSourceInfo.vue';
import MySQLDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/MySQLSourceForm/MySQLDestConfigForm.vue';
import MsSQLSourceInfo from '@/screens/DataCook/components/SaveToDatabase/MsSQLSourceForm/MsSQLSourceInfo.vue';
import MsSQLDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/MsSQLSourceForm/MsSQLDestConfigForm.vue';
import PostgresSourceInfo from '@/screens/DataCook/components/SaveToDatabase/PostgresSourceForm/PostgresSourceInfo.vue';
import PostgresDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/PostgresSourceForm/PostgresDestConfigForm.vue';
import VerticaSourceInfo from '@/screens/DataCook/components/SaveToDatabase/VerticaSourceForm/VerticaSourceInfo.vue';
import VerticaDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/VerticaSourceForm/VerticaDestConfigForm.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

type TThirdPartyPersistConfigurationCallback = (thirdPartyPersistConfiguration: ThirdPartyPersistConfiguration, index: number) => void;

@Component({
  components: {
    MsSQLDestConfigForm,
    MsSQLSourceInfo,
    PostgresDestConfigForm,
    PostgresSourceInfo,
    MySQLSourceInfo,
    DestConfigurationForm,
    OracleSourceInfo,
    EtlModal,
    SelectDatabaseAndTable,
    MySQLDestConfigForm,
    VerticaSourceInfo,
    VerticaDestConfigForm
  }
})
export default class SaveToDatabase extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;
  private readonly databaseTypes = [
    {
      label: 'Oracle',
      value: ThirdPartyPersistConfigurations.OraclePersistConfiguration
    },
    {
      label: 'MySQL',
      value: ThirdPartyPersistConfigurations.MySQLPersistConfiguration
    },
    {
      label: 'SQL Server',
      value: ThirdPartyPersistConfigurations.MsSQLPersistConfiguration
    },
    {
      label: 'PostgreSQL',
      value: ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration
    },
    {
      label: 'Vertica',
      value: ThirdPartyPersistConfigurations.VerticaPersistConfiguration
    }
  ];
  private selectedDatabaseType: ThirdPartyPersistConfigurations = this.databaseTypes[0].value;

  private model: ThirdPartyPersistConfiguration | null = null;
  private thirdPartyConfigIndex = -1;
  private tableSchema: TableSchema | null = null;
  private callback: TThirdPartyPersistConfigurationCallback | null = null;
  private isUpdate = false;
  private loading = false;

  @Ref()
  private readonly modal!: EtlModal;

  @Ref()
  private readonly selectDatabaseAndTable!: SelectDatabaseAndTable;

  @Ref()
  private readonly oracleJdbcPersistDatabaseTableSelection!: DestConfigurationForm;

  @Ref()
  private readonly mySQLDestConfigForm!: MySQLDestConfigForm;

  @Ref()
  private readonly msSQLDestConfigForm!: MsSQLDestConfigForm;

  @Ref()
  private readonly postgresDestConfigForm!: PostgresDestConfigForm;

  @Ref()
  private readonly verticaDestConfigForm!: VerticaDestConfigForm;

  private get isOracleJdbcPersist() {
    return this.model?.className === ThirdPartyPersistConfigurations.OraclePersistConfiguration;
  }

  private get isMySQLPersist() {
    return this.model?.className === ThirdPartyPersistConfigurations.MySQLPersistConfiguration;
  }

  private get isPostgresPersist() {
    return this.model?.className === ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration;
  }

  private get isMsSQLPersist() {
    return this.model?.className === ThirdPartyPersistConfigurations.MsSQLPersistConfiguration;
  }

  private get isVerticaPersist() {
    return this.model?.className === ThirdPartyPersistConfigurations.VerticaPersistConfiguration;
  }

  private get actionName() {
    return this.isUpdate ? 'Update' : 'Add';
  }

  private get persistentTypes() {
    return [PERSISTENT_TYPE.Update, PERSISTENT_TYPE.Append];
  }
  @Watch('selectedDatabaseType')
  private handleSelectDatabaseType(newDatabaseType: ThirdPartyPersistConfigurations, oldDatabaseType: ThirdPartyPersistConfigurations) {
    if (newDatabaseType !== oldDatabaseType) {
      this.model = ThirdPartyPersistConfiguration.default(newDatabaseType);
    }
  }

  save(operator: EtlOperator, tableSchema: TableSchema, callback: TThirdPartyPersistConfigurationCallback, thirdPartyConfigIndex: number) {
    this.isUpdate = thirdPartyConfigIndex >= 0 ? true : false;
    this.tableSchema = tableSchema;
    this.thirdPartyConfigIndex = thirdPartyConfigIndex;
    //todo: Add third party default if select new
    this.model = this.isUpdate
      ? this.getUpdateThirdPartyPersistConfig(thirdPartyConfigIndex, operator)
      : ThirdPartyPersistConfiguration.default(this.selectedDatabaseType);
    Log.debug('SaveToDatabase::save::model::', this.model);
    this.callback = callback;
    // @ts-ignore
    this.modal.show();
    this.trackSaveToDatabase(this.isUpdate);
  }

  private trackSaveToDatabase(isUpdate: boolean) {
    if (isUpdate) {
      TrackingUtils.track(TrackEvents.ETLEditSaveToDatabase, {});
    } else {
      TrackingUtils.track(TrackEvents.ETLSaveToDatabase, {});
    }
  }

  private getUpdateThirdPartyPersistConfig(index: number, operator: EtlOperator): ThirdPartyPersistConfiguration {
    //@ts-ignore
    const selectedItem = operator.thirdPartyPersistConfigurations[index];
    if (selectedItem) {
      return selectedItem;
    } else {
      return ThirdPartyPersistConfiguration.default(this.selectedDatabaseType);
    }
  }

  private resetModel() {
    this.model = null;
    this.callback = null;
    this.tableSchema = null;
    this.loading = false;
  }

  private getDatabaseNameAndTableName(): { database: string | null; table: string | null } {
    switch (this.model!.className) {
      case ThirdPartyPersistConfigurations.OraclePersistConfiguration:
        return this.oracleJdbcPersistDatabaseTableSelection.getDatabaseNameAndTableName();
      case ThirdPartyPersistConfigurations.MySQLPersistConfiguration:
        return this.mySQLDestConfigForm.getDatabaseNameAndTableName();
      case ThirdPartyPersistConfigurations.MsSQLPersistConfiguration:
        return this.msSQLDestConfigForm.getDatabaseNameAndTableName();
      case ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration:
        return this.postgresDestConfigForm.getDatabaseNameAndTableName();
      case ThirdPartyPersistConfigurations.VerticaPersistConfiguration:
        return this.verticaDestConfigForm.getDatabaseNameAndTableName();
      default:
        return { database: null, table: null };
    }
  }

  @Track(TrackEvents.ETLSubmitSaveToDatabase)
  private async submit() {
    this.loading = true;
    const data = this.getDatabaseNameAndTableName();
    this.loading = false;
    if (data.table && data.database && this.tableSchema && this.model && this.callback) {
      this.model.databaseName = data.database;
      this.model.tableName = data.table;
      this.callback(this.model, this.thirdPartyConfigIndex);
      // @ts-ignore
      this.modal.hide();
    }
  }
}
</script>
<style lang="scss" scoped>
label.di-radio {
  opacity: 1;
}
.save-to-database {
  .scroll-body {
    max-height: 389px;
    padding-right: 12px;
  }
  ::v-deep .modal-content {
    .modal-header {
      background: var(--secondary);
      border: 1px solid #f2f2f7;
      padding-bottom: 10px !important;
    }
    .modal-body {
      padding: 0;
      background: var(--secondary);
      border-top: 1px solid #bebebe;
      .save-to-db {
        background-color: var(--secondary);
        padding: 16px 4px 16px 16px;
        border-radius: 4px;
      }
    }
  }
  ::v-deep {
    .select-container {
      height: 34px;
      button {
        height: 34px;
      }
      ul li {
        height: 34px;
      }
      button {
        div {
          height: 34px;
        }
      }
    }
    .form-group.di-theme {
      margin-bottom: 0;
    }
  }
  .persist-configuration-info {
    ::v-deep {
      input {
        padding: 0 12px;
        min-height: 34px !important;
      }
      .title {
        margin-bottom: 8px;
      }
    }
  }

  .database-table-selection {
    ::v-deep {
    }
  }
}
</style>
