<template>
  <div>
    <EtlModal @submit="submit" @hidden="resetModel" ref="modal" :actionName="actionName" :width="1680" :title="title">
      <div v-if="model && tableSchema" class="oblock">
        <div class="d-flex align-items-center">
          <strong>{{ tableSchema.displayName || tableSchema.name }}</strong>
          <span class="ml-auto">
            <DiButton @click.prevent="addExpressionField" title="Add field">
              <i class="di-icon-add"></i>
            </DiButton>
          </span>
        </div>
        <vuescroll class="mt-2">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th v-for="field in model.fields" :key="field.fieldName">
                    <div class="mf-column">
                      <div class="mf-column-name" ref="td" :data-title="field.displayName" :class="{ disabled: field.isHidden }">
                        <span>{{ field.displayName }}</span>
                      </div>
                      <span class="mf-column-actions">
                        <button :disabled="field.isHidden" @click.prevent="editNormalField(field)" class="btn" :class="{ disabled: field.isHidden }">
                          <i class="di-icon-edit btn-icon btn-icon-border"></i>
                        </button>
                        <button @click.prevent="toggleField(field)" class="btn">
                          <i v-if="field.isHidden" class="di-icon-restore btn-icon btn-icon-border"></i>
                          <i v-else class="di-icon-delete btn-icon btn-icon-border"></i>
                        </button>
                      </span>
                    </div>
                    <DiDropdown
                      v-model="field.asType"
                      :disabled="field.isHidden"
                      :data="columnTypes"
                      label-props="name"
                      value-props="id"
                      :class="{ disabled: field.isHidden }"
                      @change="getData"
                      @selected="handleFieldTypeChange(field, ...arguments)"
                      :appendAtRoot="true"
                    ></DiDropdown>
                  </th>
                  <th v-for="field in model.extraFields" :key="field.fieldName" class="vertical-align-top">
                    <div class="mf-column">
                      <span class="mf-column-name" ref="td" :data-title="field.displayName" :class="{ disabled: field.isHidden }">
                        <span>{{ field.displayName }}</span>
                      </span>
                      <span class="mf-column-actions">
                        <button :disabled="field.isHidden" @click.prevent="editExpressionField(field)" class="btn" :class="{ disabled: field.isHidden }">
                          <i class="di-icon-edit btn-icon btn-icon-border"></i>
                        </button>
                        <button @click.prevent="removeExtraField(field)" class="btn">
                          <i v-if="field.isHidden" class="di-icon-restore btn-icon btn-icon-border"></i>
                          <i v-else class="di-icon-delete btn-icon btn-icon-border"></i>
                        </button>
                      </span>
                    </div>
                    <DiDropdown
                      v-model="field.asType"
                      :disabled="field.isHidden"
                      :data="extraColumnTypes"
                      label-props="name"
                      value-props="id"
                      :class="{ disabled: field.isHidden }"
                      @change="getData"
                      :appendAtRoot="true"
                    ></DiDropdown>
                  </th>
                </tr>
              </thead>
              <tbody v-if="!queryLoading && queryData">
                <tr v-for="(row, rowIdx) in queryData.records" :key="rowIdx">
                  <td
                    v-for="(field, columnIdx) in model.fields"
                    :key="field.fieldName"
                    :data-title="row[columnIdx] || '--'"
                    :class="{ disabled: field.isHidden }"
                    ref="td"
                  >
                    <span>
                      {{ row[columnIdx] || '--' }}
                    </span>
                  </td>
                  <td
                    v-for="(extraField, columnIdx) in model.extraFields"
                    :key="extraField.fieldName"
                    :data-title="row[model.fields.length + columnIdx] || '--'"
                    :class="{ disabled: extraField.isHidden }"
                    ref="td"
                  >
                    <span>
                      {{ row[model.fields.length + columnIdx] || '--' }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <!--              <tbody v-else-if="!queryLoading">-->
              <!--                <td :colspan="model.totalFields" class="p-0">-->
              <!--                  <div style="height: 288px">-->
              <!--                    <p class="text-danger p-3">-->
              <!--                      <strong>Error: </strong>-->
              <!--                      {{ errorMsg }}-->
              <!--                    </p>-->
              <!--                  </div>-->
              <!--                </td>-->
              <!--              </tbody>-->
            </table>
          </div>
        </vuescroll>
        <div v-if="queryLoading || errorMsg" class="mf-results">
          <LoadingComponent v-if="queryLoading"></LoadingComponent>
          <ErrorWidget v-else @onRetry="getData" :error="errorMsg"></ErrorWidget>
          <!--          <vuescroll v-else>-->
          <!--            <div class="text-center text-danger p-3">-->
          <!--              <strong>Error: </strong>-->
          <!--              {{ errorMsg }}-->
          <!--            </div>-->
          <!--            <div class="text-center mb-3">-->
          <!--              <button @click.prevent="getData" class="btn btn-sm btn-primary px-3">Retry</button>-->
          <!--            </div>-->
          <!--          </vuescroll>-->
        </div>
        <!--        <PreviewTableData :database-name="tableSchema.dbName" :table-name="tableSchema.name">-->
        <!--          <template #default="{ hasData, response }">-->
        <!--            <table class="table">-->
        <!--              <thead>-->
        <!--                <tr>-->
        <!--                  <th v-for="field in model.fields" :key="field.fieldName">-->
        <!--                    <div class="mf-column">-->
        <!--                      <span class="mf-column-name" :class="{ disabled: field.isHidden }">-->
        <!--                        {{ field.displayName }}-->
        <!--                      </span>-->
        <!--                      <span class="mf-column-actions">-->
        <!--                        <button :disabled="field.isHidden" @click.prevent="editNormalField(field)" class="btn" :class="{ disabled: field.isHidden }">-->
        <!--                          <i class="di-icon-edit btn-icon btn-icon-border"></i>-->
        <!--                        </button>-->
        <!--                        <button @click.prevent="toggleField(field)" class="btn">-->
        <!--                          <i v-if="field.isHidden" class="di-icon-restore btn-icon btn-icon-border"></i>-->
        <!--                          <i v-else class="di-icon-delete btn-icon btn-icon-border"></i>-->
        <!--                        </button>-->
        <!--                      </span>-->
        <!--                    </div>-->
        <!--                    <DiDropdown-->
        <!--                      v-model="field.asType"-->
        <!--                      :disabled="field.isHidden"-->
        <!--                      :data="columnTypes"-->
        <!--                      label-props="name"-->
        <!--                      value-props="id"-->
        <!--                      :class="{ disabled: field.isHidden }"-->
        <!--                    ></DiDropdown>-->
        <!--                  </th>-->
        <!--                  <th v-for="field in model.extraFields" :key="field.fieldName" class="vertical-align-top">-->
        <!--                    <div class="mf-column">-->
        <!--                      <span class="mf-column-name" :class="{ disabled: field.isHidden }">-->
        <!--                        {{ field.displayName }}-->
        <!--                      </span>-->
        <!--                      <span class="mf-column-actions">-->
        <!--                        <button :disabled="field.isHidden" @click.prevent="editExpressionField(field)" class="btn" :class="{ disabled: field.isHidden }">-->
        <!--                          <i class="di-icon-edit btn-icon btn-icon-border"></i>-->
        <!--                        </button>-->
        <!--                        <button @click.prevent="toggleField(field)" class="btn">-->
        <!--                          <i v-if="field.isHidden" class="di-icon-restore btn-icon btn-icon-border"></i>-->
        <!--                          <i v-else class="di-icon-delete btn-icon btn-icon-border"></i>-->
        <!--                        </button>-->
        <!--                      </span>-->
        <!--                    </div>-->
        <!--                  </th>-->
        <!--                </tr>-->
        <!--              </thead>-->
        <!--              <tbody v-if="response.records && response.records[0]">-->
        <!--                <tr v-for="rowIdx in Object.keys(response.records[0])" :key="rowIdx">-->
        <!--                  <td v-for="(field, columnIdx) in model.fields" :key="field.fieldName" :class="{ disabled: field.isHidden }">-->
        <!--                    <template v-if="response.records[columnIdx] && response.records[columnIdx][rowIdx]">{{ response.records[columnIdx][rowIdx] }}</template>-->
        <!--                  </td>-->
        <!--                  <td v-for="field in model.extraFields" :key="field.fieldName" :class="{ disabled: field.isHidden }"></td>-->
        <!--                </tr>-->
        <!--              </tbody>-->
        <!--            </table>-->
        <!--          </template>-->
        <!--        </PreviewTableData>-->
      </div>
    </EtlModal>
    <ManageNormalField :data="model" ref="manageNormalField"></ManageNormalField>
    <ManageExpressionField @submit="handleManageExpressionField" :data="model" ref="manageExpressionField"></ManageExpressionField>
  </div>
</template>
<script lang="ts" src="./ManageFields.ts"></script>
<style lang="scss" scoped>
$item-size: 140px;
.btn-icon {
  opacity: 1;
}

.vertical-align-top {
  vertical-align: top !important;
}

.disabled {
  opacity: 0.5;
}

.modal-operator {
  .mf-column {
    min-width: $item-size;
    display: flex;
    align-items: center;
    margin-bottom: 6px;

    &-name {
      margin-right: 10px;
      font-weight: 500;
      flex: 1;
      position: relative;

      &:before {
        content: '&nbsp;';
        visibility: hidden;
      }

      > span {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: inline-block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &-actions {
      margin-left: auto;
      white-space: nowrap;
      margin-right: -6px;

      .btn {
        width: auto;
        padding: 0;
        .btn-icon-border {
          padding: 6px;
        }
      }
    }
  }

  ::v-deep .data-builder-body {
    min-width: 0;
    padding: 0;

    .config-filter-area,
    .database-panel,
    .visualization-panel {
      background-color: var(--secondary);
      border-radius: 4px;
      max-height: calc(100vh - 140px);
    }

    //.database-listing {
    //  margin-right: 10px;
    //}
    //.visualization-panel {
    //  margin-left: 10px;
    //}

    //& > .data-builder-body {
    //  width: 100%;
    //  $width: 223px;
    //  .database-panel {
    //    background-color: var(--secondary);
    //    flex: none;
    //    width: 223px;
    //  }
    //  .query-builder-body {
    //    width: calc(100% - #{$width});
    //  }
    //}
  }

  .mf-results {
    //background-color: var(--active-color);
    margin-top: -16px;
    height: 304px;
  }
}

.table-responsive .table {
  thead {
    //background-color: var(--input-background-color);
    //border-radius: 4px;

    th {
      border-top: none;
      border-bottom: none;
      background-color: var(--input-background-color);
    }
    tr {
      th:first-child {
        border-radius: 4px 0 0 4px;
      }
      th:last-child {
        border-radius: 0 4px 4px 0;
      }
    }
  }
  tbody {
    tr:first-child {
      td {
        border-top: none;
      }
    }
    td {
      padding-top: 0;
      padding-bottom: 0;
    }
  }
  tr {
    td,
    th {
      width: 204px;
    }

    td {
      position: relative;
      &:before {
        content: '&nbsp;';
        visibility: hidden;
      }
    }

    td > span {
      position: absolute;
      top: 50%;
      left: 0.75rem;
      right: 0.75rem;
      display: inline-block;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      transform: translateY(-50%);
    }
  }

  ::v-deep .select-container > .relative > span > button {
    background-color: var(--secondary);
    height: 33px;
  }
}
</style>
