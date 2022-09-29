<template>
  <div class="describe-db-container">
    <div class="row">
      <div class="col-12">
        <div class="describe-db mx-auto">
          <div :class="{ 'is-invalid': database.error }" class="form-group">
            <label>Select or create new database</label>
            <DiDropdown
              id="di-database-selection"
              v-model="database.selected"
              :class="{ 'is-invalid': !database.createNew && database.error }"
              :data="database.items"
              :placeholder="databasePlaceholder"
              hidePlaceholderOnMenu
              labelProps="display_name"
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
              :id="genInputId('database-name')"
              ref="newDatabase"
              v-model.trim="database.createNewModel"
              :class="{ 'is-invalid': database.error }"
              class="form-control mt-3"
              placeholder="Input name new database"
              type="text"
              @input="resetDatabaseError"
            />
            <div class="invalid-feedback" v-html="database.error"></div>
          </div>
          <div class="form-group">
            <label>Select or create new table</label>
            <div>
              <DiDropdown
                id="di-table-selection"
                v-model="table.selected"
                :class="{ 'is-invalid': !table.createNew && table.error }"
                :data="table.items"
                :placeholder="tablePlaceholder"
                hidePlaceholderOnMenu
                labelProps="display_name"
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
              :id="genInputId('table-name')"
              ref="newTable"
              v-model.trim="table.createNewModel"
              :class="{ 'is-invalid': table.error }"
              class="form-control mt-3"
              placeholder="Input name new table"
              type="text"
              @input="resetTableError"
              @keydown.enter="register"
            />
            <div class="invalid-feedback" v-html="table.error"></div>
          </div>
          <div v-if="error" class="form-group">
            <strong class="invalid-feedback d-block" v-html="error"></strong>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12 text-right mt-2 d-flex">
        <button class="btn btn-secondary" @click.prevent="back">Back</button>
        <button :disabled="loading" class="btn btn-di-primary w-100" @click.prevent="register">Next</button>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.describe-db-container {
  #di-database-selection,
  #di-table-selection {
    height: 34px;
  }

  .btn {
    width: 168px !important;
  }
  .btn-secondary {
    margin-right: 12px;
  }
}

.describe-db input {
  border: transparent !important;
}
</style>
<script src="./DescribeDatabase.js"></script>
