<template>
  <div class="dest-database-table-selection">
    <div :class="{ 'is-invalid': model.database.error }" class="form-group">
      <label class="w-100 d-flex align-items-center">
        Select or type your database <i class="di-icon-reset w-auto ml-auto btn-icon btn-icon-border" @click="reloadData"></i>
      </label>
      <DiDropdown
        id="di-database-selection"
        v-model="model.database.selected"
        :class="{ 'is-invalid': !model.database.createNew && model.database.error }"
        :data="databaseItems"
        :placeholder="databasePlaceholder"
        hidePlaceholderOnMenu
        :appendAtRoot="true"
        boundary="viewport"
        labelProps="displayName"
        valueProps="name"
        @change="selectDatabase"
        :disabled="disabled || loading"
        :loading="true"
      >
        <template slot="before-menu" slot-scope="{ hideDropdown }">
          <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewDatabaseOption(hideDropdown)">
            Type your database
          </li>
        </template>
        <template slot="icon-dropdown">
          <i v-if="loading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
          <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
        </template>
      </DiDropdown>
      <input
        v-if="model.database.createNew"
        ref="newDatabase"
        v-model.trim="model.database.createNewModel"
        :class="{ 'is-invalid': model.database.error }"
        class="form-control mt-2 new-db-input text-truncate"
        placeholder="Type your database here"
        type="text"
        @input="resetDatabaseError"
        :disabled="disabled || loading"
      />
      <div class="invalid-feedback" v-html="model.database.error"></div>
    </div>
    <div :class="{ 'is-invalid': !model.table.createNew && model.table.error }" class="form-group">
      <template>
        <label v-if="!disableCreateTable">Select or type your table</label>
        <label v-else>Select table</label>
      </template>
      <DiDropdown
        id="di-table-selection"
        v-model="model.table.selected"
        :class="{ 'is-invalid': !model.table.createNew && model.table.error }"
        :data="tableItems"
        :placeholder="tablePlaceholder"
        :appendAtRoot="true"
        boundary="viewport"
        hidePlaceholderOnMenu
        labelProps="displayName"
        valueProps="name"
        @change="selectTable"
        :disabled="disabled || loading"
        :loading="loading"
      >
        <template v-if="!disableCreateTable" slot="before-menu" slot-scope="{ hideDropdown }">
          <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewTableOption(hideDropdown)">
            Type your table
          </li>
        </template>
        <template slot="icon-dropdown">
          <i v-if="loading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
          <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
        </template>
      </DiDropdown>
      <input
        v-if="model.table.createNew"
        ref="newTable"
        v-model.trim="model.table.createNewModel"
        :class="{ 'is-invalid': model.table.error }"
        class="form-control mt-2 new-table-input text-truncate"
        placeholder="Type your table here"
        type="text"
        @input="resetTableError"
        @keydown.enter="register"
        :disabled="disabled || loading"
      />
      <div class="invalid-feedback" v-html="model.table.error"></div>
    </div>
    <div v-if="error" class="form-group">
      <strong class="invalid-feedback d-block" v-html="error"></strong>
    </div>
    <slot></slot>
  </div>
</template>
<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { CreateTableRequest, DatabaseCreateRequest, DatabaseSchema, TableSchema } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Inject as InjectService } from 'typescript-ioc';
import { ThirdPartyPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/ThirdPartyPersistConfiguration';
import { DataCookService } from '@core/data-cook';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { PopupUtils } from '@/utils/PopupUtils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';

type TModel = {
  database: {
    loading: boolean;
    selected: string | null;
    model: string | null;
    createNew: boolean;
    createNewModel: string;
    error: string;
  };
  table: {
    selected: string | null;
    model: string | null;
    createNew: boolean;
    createNewModel: string;
    error: string;
  };
};
@Component({
  components: { DiButton }
})
export default class DestDatabaseTableSelection extends Vue {
  private loading = false;
  private error = '';
  private databaseItems: DropdownData[] = [];
  private tableItems: DropdownData[] = [];

  model: TModel = {
    database: {
      loading: false,
      selected: null,
      model: null as string | null,
      createNew: false,
      createNewModel: '',
      error: ''
    },
    table: {
      selected: null,
      model: null as string | null,
      createNew: false,
      createNewModel: '',
      error: ''
    }
  };

  @Prop({ type: String, default: '' })
  private readonly databaseName!: string;

  @Prop({ type: Boolean })
  private readonly disabled!: string;

  @Prop({ type: String, default: '' })
  private readonly tableName!: string;

  @Prop({ type: Boolean, default: false })
  private readonly disableCreateTable!: boolean;

  @PropSync('thirdPartyPersistConfiguration')
  syncedThirdPartyPersistConfiguration!: ThirdPartyPersistConfiguration;

  @InjectService
  private readonly schemaService!: SchemaService;

  @InjectService
  private dataCookService!: DataCookService;

  @Ref('newTable')
  private readonly newTableEl!: HTMLInputElement;

  @Ref('newDatabase')
  private readonly newDatabaseEl!: HTMLInputElement;

  private async mounted() {
    if (StringUtils.isNotEmpty(this.databaseName) && StringUtils.isNotEmpty(this.tableName)) {
      await this.initData();
    }
  }

  async initData() {
    if (StringUtils.isNotEmpty(this.databaseName)) {
      this.loading = true;
      this.databaseItems = await this.getDatabases(this.syncedThirdPartyPersistConfiguration);
      const foundDb = this.databaseName ? this.databaseItems.find(db => db.name === this.databaseName) : undefined;
      if (foundDb) {
        await this.selectDatabase(foundDb.name);
        const foundTbl = this.tableName ? this.tableItems.find(tbl => tbl.name === this.tableName) : undefined;
        if (foundTbl) {
          this.selectTable(this.tableName);
        } else {
          this.model.table.createNew = true;
          this.model.table.selected = null;
          this.model.table.createNewModel = this.tableName;
        }
      } else {
        this.model.database.createNew = true;
        this.model.table.selected = null;
        this.model.database.createNewModel = this.databaseName;
        this.model.table.createNew = true;
        this.model.table.selected = null;
        this.model.table.createNewModel = this.tableName;
      }
      this.loading = false;
    }
  }

  async reloadData() {
    this.loading = true;
    this.databaseItems = await this.getDatabases(this.syncedThirdPartyPersistConfiguration);
    this.tableItems = await this.getTables(this.syncedThirdPartyPersistConfiguration, this.getCurrentDatabase());
    this.loading = false;
  }

  async getDatabases(config: ThirdPartyPersistConfiguration): Promise<DropdownData[]> {
    return await this.dataCookService
      .listThirdPartyDatabase(config)
      .then(response => {
        return response.data.map(item => {
          return {
            displayName: item.name,
            name: item.name
          };
        });
      })
      .catch(e => {
        return [];
      });
  }

  async getTables(config: ThirdPartyPersistConfiguration, databaseName: string): Promise<DropdownData[]> {
    if (StringUtils.isNotEmpty(databaseName)) {
      return await this.dataCookService
        .listThirdPartyTable(config, databaseName)
        .then(response => {
          return response.data.map(item => {
            return {
              displayName: item.name,
              name: item.name
            };
          });
        })
        .catch(e => {
          return [];
        });
    } else {
      return [];
    }
  }

  getDatabaseAndTable(): { database: string | null; table: string | null } {
    const db = this.getTargetDatabase();
    let table = null;
    // if (!this.model.table.createNewModel) {
    // @ts-ignore
    table = this.getTargetTable();
    // }
    return {
      database: db,
      table: table
    };
  }

  private get databasePlaceholder() {
    if (this.loading) return 'Loading database...';
    if (this.model.database.createNew) return 'Type your database';
    return 'Select database...';
  }

  private get tablePlaceholder() {
    if (this.loading) return 'Loading table...';
    else if (this.model.table.createNew) return 'Type your table';
    return 'Select table...';
  }

  private async selectDatabase(database: string) {
    if (this.model.database.model === database && !this.model.database.createNew) return;
    this.model.database.selected = database;
    this.model.database.model = database;
    this.model.database.createNew = false;
    if (this.model.table.model) {
      this.model.table.createNew = false;
    }
    this.model.table.model = null;
    if (database) {
      this.loading = true;
      this.tableItems = await this.getTables(this.syncedThirdPartyPersistConfiguration, this.getCurrentDatabase());
      this.loading = false;
    }
    this.model.database.error = '';
  }

  private getTargetTable(): string | null {
    if (!this.model.database.model && !this.model.database.createNew && this.model.database.createNewModel.length <= 0) {
      this.model.table.error = 'Please select database first.';
      return null;
    }

    if (this.model.table.createNew && this.model.table.createNewModel.length <= 0) {
      this.model.table.error = 'Please input table name.';
      this.newTableEl.focus();
      return null;
    }

    const tableName = this.makeNameFromDisplayName(this.model.table.createNewModel);
    if (StringUtils.isNumberFirst(tableName)) {
      this.model.table.error = "Table name can't start with a digit";
      this.newTableEl.focus();
      return null;
    }

    if (this.model.database.model && this.model.table.createNew) {
      this.model.table.error = '';
      const tableName = this.makeNameFromDisplayName(this.model.table.createNewModel);
      const isDuplicated = this.tableItems.find(table => table.name === tableName);
      if (isDuplicated) {
        this.model.table.error = 'Already exists table name. Please choose another!';
        this.newTableEl.focus();
        return null;
      } else {
        return tableName;
      }
    }

    if (this.model.table.createNew) {
      return this.makeNameFromDisplayName(this.model.table.createNewModel);
    }

    if (this.model.table.model) {
      this.model.table.error = '';
      return this.model.table.model;
    }

    this.model.table.error = 'Please select table.';
    return null;
  }

  private selectNewDatabaseOption(callback?: Function) {
    this.model.database.createNew = true;
    this.model.database.error = '';
    this.model.database.selected = null;
    this.model.database.model = null;
    this.model.table.model = null;
    this.model.table.createNew = true;
    this.model.table.selected = null;
    this.model.table.error = '';
    callback ? callback() : null;
    this.$nextTick(() => {
      if (this.newDatabaseEl) {
        this.newDatabaseEl.focus();
      }
    });
  }

  private resetDatabaseError() {
    this.model.database.error = '';
  }

  private selectTable(table: string) {
    if (this.model.table.model === table && !this.model.table.createNew) return;
    this.model.table.model = table;
    this.model.table.selected = table;
    this.model.table.createNew = false;
    this.model.table.error = '';
  }

  private selectNewTableOption(callback?: Function) {
    this.model.table.createNew = true;
    this.model.table.error = '';
    this.model.table.selected = null;
    this.model.table.model = null;
    callback ? callback() : null;
    this.$nextTick(() => {
      if (this.newTableEl) {
        this.newTableEl.focus();
      }
    });
  }

  private resetTableError() {
    this.model.table.error = '';
  }

  private makeNameFromDisplayName(displayName = '') {
    return displayName.toLowerCase().replace(/[^(\d\w_)]/g, '_');
  }

  getCurrentDatabase(): string {
    if (this.model.database.model) {
      return this.model.database.model;
    } else if (this.model.database.createNew) {
      return this.makeNameFromDisplayName(this.model.database.createNewModel);
    } else {
      return this.databaseName;
    }
  }

  getCurrentTable(): string {
    if (this.model.table.model) {
      return this.model.table.model;
    } else if (this.model.table.createNew) {
      return this.model.table.createNewModel;
    } else {
      return this.tableName;
    }
  }

  private getTargetDatabase(): string | null {
    Log.debug('getTargetDatabase::');
    if (this.model.database.createNew && this.model.database.createNewModel.length <= 0) {
      this.model.database.error = 'Please input database name.';
      this.newDatabaseEl.focus();
      return null;
    }

    const databaseName = this.makeNameFromDisplayName(this.model.database.createNewModel);
    if (StringUtils.isNumberFirst(databaseName)) {
      this.model.database.error = "Database name can't start with a digit";
      this.newDatabaseEl.focus();
      return null;
    }

    if (this.model.database.createNew && this.model.database.createNewModel.length >= 0) {
      return this.makeNameFromDisplayName(this.model.database.createNewModel);
    }

    if (this.model.database.model) {
      this.model.database.error = '';
      return this.model.database.model;
    }

    this.model.database.error = 'Please select database.';
    return null;
  }

  @Watch('model', { deep: true })
  handleModelChange() {
    this.$emit('change', this.model);
  }
}
</script>
<style lang="scss" scoped>
.color-di-primary {
  color: var(--accent) !important;
}
.dest-database-table-selection {
  position: relative;
  width: calc(100% + 20px);
  margin: -10px;
  height: calc(100% + 20px);
  padding: 10px;

  .select-db-tbl-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  input {
    min-height: 34px !important;
    padding: 0 8px;
  }
}
</style>
