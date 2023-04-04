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
import { DatabaseInfo } from '@core/common/domain';

export default Vue.extend({
  name: 'DestOnlyDatabaseSuggestion',
  props: {
    id: String,
    databaseName: String,
    databaseLabel: String,
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
      }
    };
  },
  computed: {
    databasePlaceholder() {
      if (this.database.createNew) return 'Create new database';
      return 'Select database...';
    },
    labelStyle() {
      return {
        width: this.labelWidth ? `${this.labelWidth}px` : '150px'
      };
    },

    existDatabase() {
      return this.database.items.some(item => item.name === this.databaseName);
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
        } else {
          this.database.createNewModel = this.databaseName;
          this.database.createNew = true;
          this.selectNewDatabaseOption();
        }
      }
    },
    selectNewDatabaseOption(callback) {
      this.database.createNew = true;
      this.database.error = '';
      this.database.selected = null;
      this.database.model = null;
      callback ? callback() : null;
      this.$emit('changeDatabase', this.database.createNewModel, this.database.createNew);
      this.$nextTick(() => {
        this.$refs.newDatabase.focus();
      });
    },
    //db: Database Schema
    async selectDatabase(db) {
      if (this.database.model === db && !this.database.createNew) return;
      this.database.model = db;
      this.database.selected = db.name;
      this.database.createNew = false;
      this.database.error = '';
      this.$emit('changeDatabase', this.database.selected, this.database.createNew);
    },

    async getListDatabase() {
      this.database.loading = true;
      let databaseInfos = DatabaseSchemaModule.databaseInfos;
      if (ListUtils.isEmpty(databaseInfos)) {
        // const resp = await SchemaService.getListDatabase();
        databaseInfos = await DatabaseSchemaModule.loadAllDatabaseInfos();
      }
      this.database.items = databaseInfos.sort((a, b) => a.displayName.localeCompare(b.displayName));
      Log.debug('destDatabases::', this.database.items);
      this.database.loading = false;
    },

    async getDatabaseDetail(databaseName) {
      if (!this.database.mapDetail[databaseName]) {
        const resp = await SchemaService.getDatabaseDetail(databaseName);
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
        DatabaseSchemaModule.setDatabases(databaseInfos);
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

    resetDatabaseError() {
      this.database.error = '';
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
    setDatabaseName(name) {
      Log.debug('DestDatabaseSuggestion::setDatabaseName', this.database.items);
      const foundDatabaseSchema = this.database.items.find(db => db.name === name);
      Log.debug('DestOnlyDatabaseSuggestion::setDatabaseName::foundDatabaseSchema::', foundDatabaseSchema);
      if (foundDatabaseSchema) {
        this.selectDatabase(foundDatabaseSchema);
      } else {
        this.database.createNew = true;
        this.database.error = '';
        this.database.selected = null;
        this.database.model = null;
        this.database.createNewModel = name;

        this.$emit('changeDatabase', this.database.createNewModel, this.database.createNew);
      }
    }
  },

  watch: {
    'database.createNewModel'(newValue) {
      this.$emit('changeDatabase', newValue, this.database.createNew);
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
