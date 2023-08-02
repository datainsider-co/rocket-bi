<template>
  <div class="select-db-tbl">
    <!--    <div class="select-db-tbl-loading">-->
    <!--      <LoadingComponent></LoadingComponent>-->
    <!--    </div>-->
    <div :class="{ 'is-invalid': model.database.error }" class="form-group">
      <label>Select or create new database</label>
      <DiDropdown
        id="di-database-selection"
        v-model="model.database.selected"
        :class="{ 'is-invalid': !model.database.createNew && model.database.error }"
        :data="databaseSchemas"
        :placeholder="databasePlaceholder"
        hidePlaceholderOnMenu
        labelProps="displayName"
        valueProps="name"
        @selected="handleOnDatabaseSelected"
        :disabled="disabled || loading"
        :loading="true"
        :appendAtRoot="true"
      >
        <template slot="before-menu" slot-scope="{ hideDropdown }">
          <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewDatabaseOption(hideDropdown)">
            Create new database
          </li>
        </template>
        <template slot="icon-dropdown">
          <i v-if="loading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
          <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
        </template>
      </DiDropdown>
      <input
        v-if="model.database.createNew"
        :id="genInputId('database-name')"
        ref="newDatabase"
        v-model.trim="model.database.createNewModel"
        :class="{ 'is-invalid': model.database.error }"
        class="form-control mt-3 new-db-input"
        placeholder="Input name new database"
        type="text"
        @input="resetDatabaseError"
        :disabled="disabled || loading"
      />
      <div class="invalid-feedback" v-html="model.database.error"></div>
    </div>
    <div :class="{ 'is-invalid': !model.table.createNew && model.table.error }" class="form-group">
      <template>
        <label v-if="!disableCreateTable">Select or create new table</label>
        <label v-else>Select table</label>
      </template>
      <DiDropdown
        id="di-table-selection"
        v-model="model.table.selected"
        :class="{ 'is-invalid': !model.table.createNew && model.table.error }"
        :data="tableSchemas"
        :placeholder="tablePlaceholder"
        hidePlaceholderOnMenu
        labelProps="displayName"
        valueProps="name"
        @selected="selectTable"
        :disabled="disabled || loading"
        :loading="loading"
        :appendAtRoot="true"
      >
        <template v-if="!disableCreateTable" slot="before-menu" slot-scope="{ hideDropdown }">
          <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewTableOption(hideDropdown)">
            Create new table
          </li>
        </template>
        <template slot="icon-dropdown">
          <i v-if="loading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
          <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
        </template>
      </DiDropdown>
      <input
        v-if="model.table.createNew"
        :id="genInputId('table-name')"
        ref="newTable"
        v-model.trim="model.table.createNewModel"
        :class="{ 'is-invalid': model.table.error }"
        class="form-control mt-3 new-table-input"
        placeholder="Input name new table"
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
<script lang="ts" src="./SelectDatabaseAndTable.ts"></script>
<style lang="scss" scoped>
.color-di-primary {
  color: var(--accent) !important;
}
.select-db-tbl {
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
}
</style>
