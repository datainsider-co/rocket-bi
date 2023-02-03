<template>
  <div class="dropdown-menu-events text-left">
    <div v-if="!hideHeader" class="font-weight-bold mb-2">
      SELECT SOURCE
      <!--      <span v-if="loading" class="fa fa-spin fa-spinner"></span>-->
      <span v-if="!loading">({{ databaseSchemas.length }})</span>
    </div>
    <div class="input-group mb-2">
      <div class="input-group-prepend">
        <span class="input-group-text px-2">
          <i class="fa fa-search"></i>
        </span>
      </div>
      <input ref="keyword" v-model.trim="keyword" type="text" debounce="100" placeholder="Search databases & tables..." class="form-control" />
    </div>
    <vuescroll>
      <LoadingComponent v-if="loading" style="height: 250px"></LoadingComponent>
      <div v-else style="max-height: 250px">
        <ErrorWidget v-if="errorMsg" :error="errorMsg" @onRetry="initSources"></ErrorWidget>
        <span v-else-if="!databaseSchemas.length" class="list-events-item text-muted font-italic">
          No database
        </span>
        <template v-else>
          <ul v-if="allNotGetOperators.length" class="list-events">
            <li class="list-events-title">{{ etlDbDisplayName }}</li>
            <li v-for="operator in allNotGetOperators" :key="`etl_database:${operator.destTableName}`" class="">
              <button :disabled="isLoadingOperator(operator)" @click.prevent="selectOperator(operator)" class="list-events-item">
                <i v-if="isLoadingOperator(operator)" class="fa fa-spin fa-spinner list-events-item-icon"></i>
                <i v-else class="di-icon-table list-events-item-icon"></i>
                {{ operator.destTableDisplayName || operator.destTableName }}
              </button>
            </li>
          </ul>
          <ul v-for="db in databaseSchemas" :key="db.name" class="list-events">
            <li class="list-events-title">{{ db.displayName || db.name }}</li>
            <li v-for="(tbl, index) in db.tables" :key="`${db.name}:${tbl.name}:${index}`" class="">
              <a @click.prevent="selectTable(db, tbl)" href="#" class="list-events-item">
                <i class="di-icon-table list-events-item-icon"></i>
                {{ tbl.displayName || tbl.name }}
              </a>
            </li>
            <li v-if="!db.tables.length">
              <span class="list-events-item text-muted font-italic">
                No tables
              </span>
            </li>
          </ul>
        </template>
      </div>
    </vuescroll>
  </div>
</template>
<script lang="ts" src="./SelectSource.ts"></script>
<style lang="scss" scoped>
$spacing: 6px;

.dropdown-menu-right {
  right: 0 !important;
}

.dropdown-menu-events {
  width: 320px;
  padding: 10px;
}

.input-group .input-group-prepend .input-group-text {
  background-color: var(--input-background-color);
}

.list-events {
  list-style: none;
  padding: 0;
  margin-bottom: 16px !important;

  li {
    display: flex;
    align-items: center;
    width: 100%;
    //margin-bottom: 12px;
  }

  &-item {
    display: flex;
    align-items: center;
    width: 100%;
    color: var(--text-color);
    text-decoration: none;
    padding: 6px $spacing;
    border: none;
    background: none;
    text-align: left;

    &:disabled {
      pointer-events: unset;
      cursor: not-allowed !important;
      color: #6c757d;
      background-color: transparent;
    }

    &:hover {
      background-color: var(--input-background-color);
      border-radius: 4px;
    }

    &-icon {
      font-size: 16px;
      margin-right: 8px;
    }
  }

  &-title {
    font-weight: 500;
    padding: 0 $spacing;

    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    background-color: var(--secondary);
    z-index: 1;
  }
}
</style>
