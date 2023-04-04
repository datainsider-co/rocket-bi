<template>
  <EtlModal ref="modal" @submit="submit" @hidden="resetModel" :loading="loading" :actionName="actionName" title="Save to Data Warehouse" :width="480">
    <form @submit.prevent="submit" v-if="model" class="oblock save-to-db m-0">
      <SelectDatabaseAndTable :disabled="loading" ref="selectDatabaseAndTable" :databaseName="model.dbName" :tableName="model.tblName">
        <div class="form-group di-theme m-0">
          <label class="d-inline-block mr-3 text-muted">Type</label>
          <label v-for="item in persistentTypes" :key="item" class="di-radio d-inline-block mr-4">
            <input :disabled="loading" v-model="model.type" :value="item" type="radio" />
            <span></span>
            <span>{{ item }}</span>
          </label>
          <br />
          <span v-if="model.type === 'Update' && model.tblName" class="text-warning text-12px">
            This action will overwrite the data and schema of the table: {{ model.tblName }}
          </span>
          <span v-if="model.type === 'Update' && !model.tblName" class="text-warning text-12px">
            This action will overwrite the data and schema of the table
          </span>
          <span v-else>&#x200B;</span>
        </div>
      </SelectDatabaseAndTable>
      <input type="submit" class="d-none" />
    </form>
  </EtlModal>
</template>
<script lang="ts" src="./SaveToDataWareHouse.ts"></script>
