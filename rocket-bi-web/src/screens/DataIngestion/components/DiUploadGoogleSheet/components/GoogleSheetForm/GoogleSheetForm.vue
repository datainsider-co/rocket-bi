<template>
  <div>
    <div class="row">
      <div class="col-12 p-0">
        <div class="describe-db mx-auto mb-3">
          <vuescroll>
            <div class="scroll-body">
              <div class="form-group">
                <label>Job name</label>
                <input
                  :id="genInputId('job-name')"
                  ref="newDatabase"
                  v-model.trim="displayName"
                  class="form-control"
                  :class="{ 'is-invalid': $v.displayName.$error }"
                  placeholder="Input display name"
                  type="text"
                  @input="resetDisplayNameError"
                />
                <div class="invalid-feedback d-block" v-if="$v.displayName.$error">Field display name is required.</div>
              </div>
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
                <!--            <div class="dropdown" :class="{ 'is-invalid': !database.createNew && database.error }">-->
                <!--              <button :disabled="database.loading" class="btn btn-di-default w-100 dropdown-toggle" data-toggle="dropdown">-->
                <!--                <span v-if="database.createNew">Create new database</span>-->
                <!--                <span v-else-if="database.model">{{ database.model.display_name || database.model.name }}</span>-->
                <!--                <span v-else>Select database...</span>-->
                <!--              </button>-->
                <!--              <div class="dropdown-menu w-100">-->
                <!--                <a @click.prevent="selectNewDatabaseOption" href="#" class="dropdown-item color-di-primary">Create new database</a>-->
                <!--                <a @click.prevent="selectDatabase(db)" v-for="db in database.items" :key="db.name" href="#" class="dropdown-item">-->
                <!--                  <span v-if="db.display_name">{{ db.display_name }}</span>-->
                <!--                  <span v-else class="text-muted">{{ db.name }}</span>-->
                <!--                </a>-->
                <!--              </div>-->
                <!--            </div>-->
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
                <!--            <div class="dropdown" :class="{ 'is-invalid': !table.createNew && table.error }">-->
                <!--              <button :disabled="table.loading || !database.model" class="btn btn-di-default w-100 dropdown-toggle" data-toggle="dropdown">-->
                <!--                <span v-if="table.createNew">Create new table</span>-->
                <!--                <span v-else-if="table.model">{{ table.model.display_name || table.model.name }}</span>-->
                <!--                <span v-else>Select table...</span>-->
                <!--              </button>-->
                <!--              <div class="dropdown-menu w-100">-->
                <!--                <a @click.prevent="selectNewTableOption" href="#" class="dropdown-item color-di-primary">Create new table</a>-->
                <!--                <a @click.prevent="selectTable(tb)" v-for="tb in table.items" :key="tb.name" href="#" class="dropdown-item">-->
                <!--                  <span v-if="tb.display_name">{{ tb.display_name }}</span>-->
                <!--                  <span v-else class="text-muted">{{ tb.name }}</span>-->
                <!--                </a>-->
                <!--              </div>-->
                <!--            </div>-->
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
                  @keydown.enter="submit"
                />
                <div class="invalid-feedback" v-html="table.error"></div>
              </div>
              <!--          <div class="form-group">-->
              <!--            <label>Sync interval(minutes):</label>-->
              <!--            <input-->
              <!--              ref="newDatabase"-->
              <!--              v-model.trim="syncInterval"-->
              <!--              class="form-control mt-1"-->
              <!--              placeholder="Input sync interval"-->
              <!--              type="number"-->
              <!--              @input="resetSyncIntervalError"-->
              <!--              @keydown.enter="submit"-->
              <!--            />-->
              <!--            <div class="invalid-feedback d-block" v-if="$v.syncInterval.$error">Field sync interval is required.</div>-->
              <!--          </div>-->
              <div class="form-group">
                <JobSchedulerForm class="job-scheduler-form-gg-sheet" :schedulerTime="scheduleTime" @change="onChangeTimeScheduler"></JobSchedulerForm>
              </div>
            </div>
          </vuescroll>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12 text-right d-flex">
        <button class="btn btn-secondary mr-2" @click.prevent="back">Back</button>
        <button class="btn btn-di-primary" @click.prevent="submit">Next</button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.describe-db input {
  border: transparent !important;
}

.scroll-body {
  height: 420px;
  width: 380px;
  margin: 0 16px;

  label {
    margin-bottom: 12px;
  }

  ::v-deep {
    .select-container {
      margin-top: 0;
    }
  }
}

::v-deep {
  button#job-scheduler-type {
    padding-left: 10px !important;
  }

  #di-database-selection,
  #di-table-selection {
    height: 34px !important;
  }
}

.job-scheduler-form-gg-sheet {
  ::v-deep {
    label,
    .text {
      color: var(--text-color) !important;
      opacity: 1 !important;
    }
    .job-scheduler-form-group {
      display: flex;
      text-align: left;
      flex-direction: column;
    }

    .form-check-label {
      margin: 0;
    }

    .frequency-radio-item {
      width: 100%;
      .bv-no-focus-ring {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
    }

    .frequency-options {
      flex-direction: column;
      align-items: flex-start !important;
      > label {
        margin-bottom: 12px !important;
        height: fit-content !important;
      }
      .text {
        font-size: 14px;
        color: var(--secondary-text-color);
      }
    }
  }
}
</style>
<script src="./GoogleSheetForm.ctrl.js"></script>
