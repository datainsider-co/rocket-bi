<template>
  <div>
    <EtlModal @submit="submit" @hidden="resetModel" ref="modal" :actionName="actionName" :width="1680" :title="title">
      <div v-if="model && tableSchema" class="oblock">
        <div class="d-flex align-items-center mb-2">
          <strong>Table: {{ tableSchema.displayName || tableSchema.name }}</strong>
          <span class="d-flex align-items-center ml-auto">
            <DiSearchInput
              border
              class="mr-2"
              style="width: 236px"
              ref="diSearchInput"
              placeholder="Search fields..."
              :value="keyword"
              @change="value => (keyword = value)"
            ></DiSearchInput>
            <DiButton @click.prevent="addExpressionField" title="Add field">
              <i class="di-icon-add"></i>
            </DiButton>
          </span>
        </div>
        <!--        <vuescroll class="mt-2">-->
        <div class="manage-field-table-responsive" :style="{ height: isLoadingData ? '48px' : `calc(48px + ${errorMsg ? '25vh' : '50vh'})` }">
          <table class="table">
            <thead>
              <tr>
                <th class="absolute-left" title="Field">
                  <div class="mf-column">
                    <div class="mf-column-name" ref="td">
                      <span><strong>Field</strong></span>
                    </div>
                  </div>
                </th>
                <th class="absolute-left-2" title="Type">
                  <div class="mf-column">
                    <div class="mf-column-name" ref="td">
                      <span><strong>Type</strong></span>
                    </div>
                  </div>
                </th>
                <template v-if="queryData && queryData.records">
                  <th v-for="(data, index) in queryData.records" :key="index" title="">
                    <div class="mf-column">
                      <div class="mf-column-name" ref="td">
                        <span></span>
                      </div>
                    </div>
                  </th>
                </template>
                <th class="absolute-right" title="Action">
                  <div class="mf-column">
                    <div class="mf-column-name" ref="td">
                      <span>Action</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody v-if="!isLoadingData">
              <template v-for="field in filteredFields">
                <tr :key="field.fieldName">
                  <td class="absolute-left" :title="field.displayName">
                    <span :class="{ disabled: field.isHidden }">
                      <strong>{{ field.displayName }}</strong>
                    </span>
                  </td>
                  <td class="absolute-left-2" :title="field.asType">
                    <span :class="{ disabled: field.isHidden }">
                      <DiDropdown
                        v-model="field.asType"
                        :disabled="field.isHidden"
                        :data="columnTypes"
                        label-props="name"
                        value-props="id"
                        @change="loadData"
                        boundary="window"
                        @selected="handleFieldTypeChange(field, ...arguments)"
                        :appendAtRoot="true"
                      ></DiDropdown>
                    </span>
                  </td>
                  <template v-if="queryData && queryData.records">
                    <td
                      v-for="(data, recordIndex) in queryData.records"
                      :key="'record-' + recordIndex"
                      :title="data[getHeaderKeyByNormalField(field)] || 'null'"
                      :class="{ disabled: field.isHidden }"
                    >
                      <span>
                        {{ data[getHeaderKeyByNormalField(field)] || '--' }}
                      </span>
                    </td>
                  </template>

                  <td class="absolute-right">
                    <span class="mf-column-actions">
                      <button :disabled="field.isHidden" @click.prevent="editNormalField(field)" class="btn">
                        <i :disabled="field.isHidden" title="Edit" class="di-icon-edit btn-icon btn-icon-border"></i>
                      </button>
                      <button @click.prevent="toggleField(field)" class="btn">
                        <i v-if="field.isHidden" title="Show" class="di-icon-eye-close btn-icon btn-icon-border"></i>
                        <i v-else title="Hide" class="di-icon-eye btn-icon btn-icon-border"></i>
                      </button>
                    </span>
                  </td>
                </tr>
              </template>
              <template v-for="(field, fieldIndex) in filteredExtraFields">
                <tr :key="'extra-field-' + fieldIndex">
                  <td class="absolute-left" :title="field.displayName">
                    <span :class="{ disabled: field.isHidden }">
                      <strong>{{ field.displayName }}</strong>
                    </span>
                  </td>
                  <td class="absolute-left-2">
                    <span :class="{ disabled: field.isHidden }">
                      <DiDropdown
                        v-model="field.asType"
                        :disabled="field.isHidden"
                        :data="extraColumnTypes"
                        label-props="name"
                        value-props="id"
                        @change="loadData"
                        boundary="window"
                        :appendAtRoot="true"
                      ></DiDropdown>
                    </span>
                  </td>
                  <template v-if="queryData && queryData.records">
                    <td
                      v-for="(data, recordIndex) in queryData.records"
                      :key="'extra-record-' + recordIndex"
                      :title="data[getHeaderKeyByExpressionField(field)] || 'null'"
                      :class="{ disabled: field.isHidden }"
                    >
                      <span>
                        {{ data[getHeaderKeyByExpressionField(field)] || '--' }}
                      </span>
                    </td>
                  </template>
                  <td class="absolute-right">
                    <span class="mf-column-actions">
                      <button :disabled="field.isHidden" @click.prevent="editExpressionField(field)" class="btn">
                        <i :disabled="field.isHidden" title="Edit" class="di-icon-edit btn-icon btn-icon-border"></i>
                      </button>
                      <button @click.prevent="toggleField(field)" class="btn">
                        <i v-if="field.isHidden" title="Show" class="di-icon-eye-close btn-icon btn-icon-border"></i>
                        <i v-else title="Hide" class="di-icon-eye btn-icon btn-icon-border"></i>
                      </button>
                      <button class="btn" @click.prevent="deleteExpressionField(field)">
                        <i title="Delete" class="di-icon-delete btn-icon btn-icon-border"></i>
                      </button>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="isLoadingData" class="mf-results" style="height: 50vh">
          <LoadingComponent v-if="isLoadingData"></LoadingComponent>
        </div>
        <ErrorWidget class="manage-field-table-responsive-error" v-if="errorMsg" @onRetry="loadData" :error="errorMsg"></ErrorWidget>
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
          padding: 4px;
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
  }
}

.manage-field-table-responsive {
  position: relative;
  overflow: scroll;

  .table {
    table-layout: fixed;
    position: absolute;
    //height: 100%;

    thead {
      //background-color: var(--input-background-color);
      //border-radius: 4px;
      .absolute-right {
        //position: sticky !important;

        right: 0;
        z-index: 3;
        width: 130px;
        span,
        .mf-column,
        .mf-column-name {
          min-width: 106px;
        }
      }

      .absolute-left {
        left: 0;
        z-index: 5;
        background-color: var(--input-background-color);
      }
      .absolute-left-2 {
        left: 204px;
        z-index: 5;
        background-color: var(--input-background-color);
      }

      th {
        border-top: none;
        border-bottom: none;
        background-color: var(--input-background-color);
        height: 48px;
        position: sticky;
        z-index: 3;
        top: 0;
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
      .absolute-right {
        position: sticky !important;
        right: 0;
        background: #fff;
        z-index: 2;
        width: 130px;
      }

      .absolute-left {
        position: sticky !important;
        left: 0;
        background: #fff;
        z-index: 4;
      }

      .absolute-left-2 {
        position: sticky !important;
        left: 204px;
        background: #fff;
        z-index: 4;
      }

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
}
</style>

<style lang="scss">
.manage-field-table-responsive-error {
  height: 25vh !important;
  margin: 0 !important;
  padding: 0 !important;

  @media only screen and (max-height: 768px) {
    i {
      display: none;
    }
  }
}
</style>
