<template>
  <EtlModal ref="modal" @submit="submit" @hidden="resetModel" :width="668" :action-name="actionName" :title="title" class="modal-operator">
    <div v-if="joinConfig" class="oblock">
      <p v-if="errorMsg" class="text-danger">
        <strong>Error: </strong>
        {{ errorMsg }}
      </p>
      <div class="form-group">
        <div class="d-flex">
          <label class="font-weight-bold">Applied Join Clauses</label>
          <button @click.prevent="addCondition" class="btn p-0 ml-auto">
            <i class="di-icon-add btn-icon-border p-1"></i>
          </button>
        </div>
        <div v-if="!joinConfig.conditions.length" class="oblock-body text-center mt-2">
          <button @click.prevent="addCondition" class="btn btn-sm btn-secondary px-3">
            Add a Join clause to create a Join
          </button>
        </div>
        <vuescroll v-if="joinConfig.conditions.length">
          <div class="join-conditions">
            <table class="w-100">
              <thead>
                <tr>
                  <td class="text-left" style="width: calc(50% - 45px)">
                    <i class="di-icon-table mr-1"></i>
                    {{ leftTableSchema.displayName }}
                  </td>
                  <td style="width: 50px"></td>
                  <td class="text-left" style="width: calc(50% - 45px)">
                    <i class="di-icon-table mr-1"></i>
                    {{ rightTableSchema.displayName }}
                  </td>
                  <th style="width: 40px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(condition, idx) in joinConfig.conditions" :key="idx">
                  <td>
                    <DiDropdown
                      v-model="condition.leftFieldName"
                      @selected="column => onSelectLeftColumn(condition, column)"
                      :data="leftColumns"
                      hidePlaceholderOnMenu
                      labelProps="displayName"
                      valueProps="name"
                      placeholder="Select field"
                      appendAtRoot
                    >
                      <template v-slot:selected-item="props">
                        <template v-if="props.selectedItem">
                          <div class="column-icon mr-1">
                            <component :is="getColumnIcon(props.selectedItem)"></component>
                          </div>
                          {{ props.selectedItem.displayName }}
                        </template>
                        <template v-else>
                          {{ props.placeholder }}
                        </template>
                      </template>
                      <template v-slot:option-item="itemProps">
                        <div class="column-icon mr-1">
                          <component :is="getColumnIcon(itemProps.item)"></component>
                        </div>
                        {{ itemProps.item.displayName }}
                      </template>
                    </DiDropdown>
                  </td>
                  <td class="text-center">
                    <span class="join-condition-type text-muted">=</span>
                  </td>
                  <td>
                    <DiDropdown
                      v-model="condition.rightFieldName"
                      :data="rightColumns"
                      @selected="column => onSelectRightColumn(condition, column)"
                      hidePlaceholderOnMenu
                      labelProps="displayName"
                      valueProps="name"
                      placeholder="Select field"
                      appendAtRoot
                    >
                      <template v-slot:selected-item="props">
                        <template v-if="props.selectedItem">
                          <div class="column-icon mr-1">
                            <component :is="getColumnIcon(props.selectedItem)"></component>
                          </div>
                          {{ props.selectedItem.displayName }}
                        </template>
                        <template v-else>
                          {{ props.placeholder }}
                        </template>
                      </template>
                      <template v-slot:option-item="itemProps">
                        <div class="column-icon mr-1">
                          <component :is="getColumnIcon(itemProps.item)"></component>
                        </div>
                        {{ itemProps.item.displayName }}
                      </template>
                    </DiDropdown>
                  </td>
                  <td class="text-center">
                    <button @click.prevent="removeCondition(condition)" class="btn">
                      <i class="di-icon-delete btn-icon-border p-1"></i>
                    </button>
                    <!--                <a @click.prevent="removeCondition(condition)" href="#" class="text-default text-decoration-none">-->
                    <!--                  <i class="di-icon-delete"></i>-->
                    <!--                </a>-->
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </vuescroll>
      </div>
      <div class="form-group">
        <label class="font-weight-bold">Join Type</label>
        <div class="oblock-body">
          <label v-for="item in joinTypes" :key="item" class="mr-3">
            <input :id="'select-' + joinTypes" v-model="joinConfig.joinType" type="radio" :value="item" />
            {{ getJoinTypeName(item) }}
          </label>
        </div>
      </div>
    </div>
  </EtlModal>
</template>
<script lang="ts" src="./JoinTable.ctrl.ts"></script>
<style lang="scss" scoped>
.modal-operator ::v-deep .join-conditions {
  max-height: 300px;
  table thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #fff;
  }
  .join-condition-type {
    font-size: 16px;
  }
}
</style>
