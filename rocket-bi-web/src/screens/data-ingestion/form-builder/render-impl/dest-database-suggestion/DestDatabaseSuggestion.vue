<template>
  <div class="database-suggestion-form">
    <div :class="{ 'is-invalid': database.error }" class="form-group">
      <label :style="labelStyle">{{ databaseLabel }}</label>
      <div :style="{ width: `calc(100% - ${labelWidth}px)` }" class="d-flex flex-column">
        <DiDropdown
          id="di-database-selection"
          v-model="database.selected"
          :appendAtRoot="true"
          :class="{ 'is-invalid': !database.createNew && database.error }"
          :data="database.items"
          :placeholder="databasePlaceholder"
          hidePlaceholderOnMenu
          labelProps="displayName"
          valueProps="name"
          @selected="selectDatabase"
        >
          <template slot="before-menu" slot-scope="{ hideDropdown }">
            <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewDatabaseOption(hideDropdown)">
              Create new database
            </li>
          </template>
        </DiDropdown>

        <input
          v-if="database.createNew"
          ref="newDatabase"
          :id="genInputId('dest-database-name')"
          v-model.trim="database.createNewModel"
          :appendAtRoot="true"
          :class="{ 'is-invalid': database.error }"
          class="form-control text-truncate"
          placeholder="Input name new database"
          type="text"
          @input="resetDatabaseError"
        />
        <div class="invalid-feedback" v-html="database.error"></div>
      </div>
    </div>
    <div class="form-group mb-2">
      <label :style="labelStyle">{{ tableLabel }}</label>
      <div :style="{ width: `calc(100% - ${labelWidth}px)` }" class="d-flex flex-column">
        <div>
          <DiDropdown
            id="di-table-selection"
            v-model="table.selected"
            :appendAtRoot="true"
            :class="{ 'is-invalid': !table.createNew && table.error }"
            :data="table.items"
            :placeholder="tablePlaceholder"
            hidePlaceholderOnMenu
            labelProps="displayName"
            valueProps="name"
            @selected="selectTable"
          >
            <template slot="before-menu" slot-scope="{ hideDropdown }">
              <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewTableOption(hideDropdown)">
                Create new table
              </li>
            </template>
          </DiDropdown>
        </div>
        <input
          v-if="table.createNew"
          :id="genInputId('dest-table-name')"
          ref="newTable"
          v-model.trim="table.createNewModel"
          :class="{ 'is-invalid': table.error }"
          class="form-control text-truncate"
          placeholder="Input name new table"
          type="text"
          @input="resetTableError"
          @keydown.enter="emitSubmit"
        />
        <div class="invalid-feedback" v-html="table.error"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Database } from '@/screens/data-ingestion/components/di-upload-document/entities/DocumentSchema';
import SchemaService from '@/screens/data-ingestion/components/di-upload-document/services/SchemaService';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import Vue from 'vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { ListUtils } from '@/utils';
import { ShortDatabaseInfo } from '@core/common/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default Vue.extend({
  name: 'DestDatabaseSuggestion',
  props: {
    id: String,
    databaseName: String,
    tableName: String,
    databaseLabel: String,
    tableLabel: String,
    labelWidth: Number
  },
  data() {
    return {
      database: {
        loading: false,
        items: [],
        selected: null,
        model: null,
        mapDetail: {},
        createNew: false,
        createNewModel: '',
        error: ''
      },

      table: {
        items: [],
        selected: null,
        model: null,
        createNew: false,
        createNewModel: '',
        error: ''
      }
    };
  },
  computed: {
    databasePlaceholder() {
      if (this.database.createNew) return 'Create new database';
      return 'Select database...';
    },
    tablePlaceholder() {
      if (this.table.createNew) return 'Create new table';
      return 'Select table...';
    },
    labelStyle() {
      return {
        width: this.labelWidth ? `${this.labelWidth}px` : '150px'
      };
    },

    existDatabase() {
      return this.database.items.some(item => item.name === this.databaseName);
    },

    existTable() {
      return this.table.items.some(item => item.name === this.tableName);
    },

    tables() {
      Log.debug(this.database.model);
      if (this.database.model) {
        Log.debug(this.database.mapDetail[this.database.model.name]);
      }
      if (!this.database.model || !this.database.mapDetail[this.database.model.name]) return [];
      Log.debug(this.database.mapDetail[this.database.model.name]);
      return this.database.mapDetail[this.database.model.name].tables;
    }
  },
  async mounted() {
    await this.getListDatabase();
    await this.loadUIData();
  },
  methods: {
    setDatabasesError(message) {
      this.$refs.newDatabase.focus();
      this.database.error = message;
    },

    async loadUIData() {
      if (this.databaseName && StringUtils.isNotEmpty(this.databaseName)) {
        if (this.existDatabase) {
          Log.debug('existDatabase::', this.existDatabase);
          this.database.selected = this.databaseName;
          await this.getDatabaseDetail(this.database.selected);
          Log.debug('existTable::', this.existTable);
          if (this.existTable) {
            this.table.selected = this.tableName;
          } else {
            this.selectNewTableOption();
            this.table.createNewModel = this.tableName;
            this.table.createNew = true;
          }
        } else {
          this.database.createNewModel = this.databaseName;
          this.table.createNewModel = this.tableName;
          this.database.createNew = true;
          this.table.createNew = true;
          this.selectNewDatabaseOption();
        }
      }
    },
    selectNewDatabaseOption(callback) {
      this.database.createNew = true;
      this.database.error = '';
      this.database.selected = null;
      this.database.model = null;
      this.table.items = [];
      this.table.model = null;
      this.table.createNew = true;
      this.table.error = '';
      callback ? callback() : null;
      this.$emit('changeDatabase', this.database.createNewModel, this.database.createNew);
      this.$nextTick(() => {
        this.$refs.newDatabase.focus();
      });
    },

    selectNewTableOption(callback) {
      this.table.createNew = true;
      this.table.error = '';
      this.table.selected = null;
      this.table.model = null;
      callback ? callback() : null;
      this.$emit('changeTable', this.table.createNewModel, this.table.createNew);
      this.$nextTick(() => {
        this.$refs.newTable.focus();
      });
    },
    //db: Database Info
    async selectDatabase(db) {
      Log.debug('DestDatabaseSuggestion::selectDatabase::', db);
      if (this.database.model === db && !this.database.createNew) return;
      this.database.model = db;
      this.database.selected = db.name;
      this.database.createNew = false;
      this.table.model = null;
      if (db && db.name) {
        await this.getDatabaseDetail(db.name);
        this.table.items = this.database.mapDetail[db.name].tables;
      } else {
        this.table.items = [];
      }
      this.database.error = '';
      this.$emit('changeDatabase', this.database.selected, this.database.createNew);
      TrackingUtils.track(TrackEvents.SelectDestDatabase, { database_name: this.database.selected });
    },

    selectTable(table) {
      if (this.table.model === table && !this.table.createNew) return;
      this.table.model = table;
      this.table.selected = table.name;
      this.table.createNew = false;
      this.table.error = '';
      Log.debug('DestDatabaseSuggestion::selectTable::end');
      this.$emit('changeTable', this.table.selected, this.table.createNew);
      TrackingUtils.track(TrackEvents.SelectDestTable, { table_name: this.table.selected });
    },

    async getListDatabase() {
      this.database.loading = true;
      let databaseInfos = DatabaseSchemaModule.databaseInfos;
      if (ListUtils.isEmpty(databaseInfos)) {
        // const resp = await SchemaService.getListDatabase();
        databaseInfos = await DatabaseSchemaModule.loadShortDatabaseInfos(false);
      }
      this.database.items = databaseInfos.sort((a, b) => a.displayName.localeCompare(b.displayName));
      Log.debug('destDatabases::', this.database.items);
      this.database.loading = false;
    },

    async getDatabaseDetail(databaseName) {
      this.table.items = [];
      if (!this.database.mapDetail[databaseName]) {
        const resp = await SchemaService.getDatabaseDetail(databaseName);
        this.table.items = resp.data.tables;
        this.database.mapDetail[databaseName] = resp.data;
        this.database.mapDetail[databaseName].tablePositions = this.database.mapDetail[databaseName].tables.sort((a, b) => a.name.localeCompare(b.name));
      }
    },

    makeNameFromDisplayName(displayName = '') {
      return displayName.toLowerCase().replace(/[^(\d\w_)]/g, '_');
    },

    async getTargetDatabase() {
      if (this.database.createNew && this.database.createNewModel.length <= 0) {
        this.database.error = 'Please input database name.';
        this.$refs.newDatabase.focus();
        return null;
      }

      if (this.database.createNew) {
        this.database.loading = true;
        this.isLoading = true;
        const newDB = new Database({
          name: this.makeNameFromDisplayName(this.database.createNewModel),
          // eslint-disable-next-line @typescript-eslint/camelcase
          display_name: this.database.createNewModel
        });
        const resp = await SchemaService.createDatabase(newDB.serialize);
        this.database.loading = false;
        this.isLoading = false;
        if (resp.error) {
          this.database.error = `Create database fail. ${resp.message}`;
          this.$refs.newDatabase.focus();
          return null;
        }

        this.database.error = '';
        const databaseInfos = [...DatabaseSchemaModule.databaseInfos];
        // databaseInfos.push(resp.data);
        //update database info in database
        DatabaseSchemaModule.setShortDatabaseInfos(databaseInfos);
        this.database.items.push(resp.data);

        this.selectDatabase(resp.data);
        return { name: resp.data.name };
      }

      if (this.database.model) {
        this.database.error = '';
        return this.database.model;
      }

      this.database.error = 'Please select database.';
      return null;
    },

    getTargetTable() {
      if (this.table.createNew && this.table.createNewModel.length <= 0) {
        this.table.error = 'Please input table name.';
        this.$refs.newTable.focus();
        return null;
      }

      if (this.table.createNew) {
        this.table.error = '';
        const tableName = this.makeNameFromDisplayName(this.table.createNewModel);
        const isDuplicated = this.table.items.find(table => table.name === tableName);
        if (isDuplicated) {
          this.table.error = 'Already exists table name. Please choose another!';
          this.$refs.newTable.focus();
          return null;
        }
        this.table.error = '';
        return {
          // eslint-disable-next-line @typescript-eslint/camelcase
          display_name: this.table.createNewModel,
          name: tableName
        };
      }

      if (this.table.model && !this.isMatchingSchema(this.table.model)) {
        this.table.error = 'Your selected table has not matched with your file. <br>Please choose the corrected table or create a new table!';
        return null;
      }

      if (this.table.model) {
        this.table.error = '';
        return this.table.model;
      }

      this.table.error = 'Please select table.';
      return null;
    },

    resetDatabaseError() {
      this.database.error = '';
    },

    resetTableError() {
      this.table.error = '';
    },

    isMatchingSchema(tableInfo) {
      if (!tableInfo) return false;
      const tableColumns = tableInfo.columns.map(column => ({ name: column.name, className: column.className }));
      const schemaColumns = this.value.schema.columns.map(column => ({
        name: column.name,
        className: column.className
      }));
      return JSON.stringify(tableColumns) === JSON.stringify(schemaColumns);
    },
    emitSubmit() {
      this.$emit('submit');
    },
    async setDatabaseName(name) {
      Log.debug('DestDatabaseSuggestion::setDatabaseName', name, this.database.items);
      const foundDatabaseSchema = this.database.items.find(db => db.name === name);
      if (foundDatabaseSchema) {
        Log.debug('DestDatabaseSuggestion::setDatabaseName::dbExisted::', foundDatabaseSchema);
        await this.selectDatabase(foundDatabaseSchema);
      } else {
        this.database.createNew = true;
        this.database.error = '';
        this.database.selected = null;
        this.database.model = null;
        this.database.createNewModel = name;
        Log.debug('DestDatabaseSuggestion::setDatabaseName::database.createNewModel::', name, this.database.createNewModel);
        this.table.items = [];
        this.table.model = null;
        this.table.createNew = true;
        this.table.error = '';
        this.$emit('changeDatabase', this.database.createNewModel, this.database.createNew);
      }
    },
    setTableName(name) {
      Log.debug('DestDatabaseSuggestion::setTableName', this.table.items);
      const tableExisted = this.table.items.find(tbl => tbl.name === name);
      if (tableExisted) {
        Log.debug('DestDatabaseSuggestion::setTableName::tableExisted', tableExisted);

        this.selectTable(tableExisted);
        this.table.createNew = false;
      } else {
        this.table.createNew = true;
        this.table.error = '';
        this.table.selected = null;
        this.table.model = null;
        this.table.createNewModel = name;
        this.$emit('changeTable', this.table.createNewModel, this.table.createNew);
      }
    }
  },

  watch: {
    'database.createNewModel'(newValue) {
      this.$emit('changeDatabase', newValue, this.database.createNew);
    },
    'table.createNewModel'(newValue) {
      this.$emit('changeTable', newValue, this.table.createNew);
    },
    async 'database.loading'(newValue) {
      if (!newValue) {
        await this.setDatabaseName(this.databaseName);
        this.setTableName(this.tableName);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.database-suggestion-form {
  .form-group {
    display: flex;
    justify-items: center;

    > label {
      height: 34px;
      display: flex;
      align-items: center;
      margin: 0;
    }

    > div {
      height: fit-content;
    }

    .form-control {
      margin-top: 12px;
    }

    margin-top: 12px;
    margin-bottom: 0;
  }
}

input {
  height: 34px;
  padding: 0 16px;
  @include regular-text();
  font-size: 12px;
  color: var(text-color);
  letter-spacing: 0.17px;
  cursor: text;

  ::-webkit-input-placeholder,
  :-ms-input-placeholder,
  ::placeholder {
    @include regular-text-14();
    letter-spacing: 0.18px;
    color: var(--text-disabled-color, #bebebe) !important;
  }
}

::v-deep {
  .select-container {
    margin-top: 0;
  }

  #di-database-selection,
  #di-table-selection {
    padding-left: 16px;
    height: 34px;

    > div {
      height: 34px;
    }

    .dropdown-input-search {
      font-size: 12px !important;
    }
  }

  .select-popover ul li {
    span.font-normal {
      font-size: 12px;
    }

    padding-left: 16px !important;
  }

  .select-popover ul li.active {
    font-size: 12px;
  }
}

.active {
  color: var(--accent) !important;
}

.select-container {
  width: 350px;
}
</style>
