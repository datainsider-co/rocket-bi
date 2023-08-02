<template>
  <div class="field-creation-container">
    <div class="data-schema-header justify-content-between">
      <div>
        <i class="fa fa-database text-muted"> </i>
        <span class="data-schema-header--dbname cursor-pointer" @click="handleCancel">
          <span v-if="model.database.displayName"> {{ model.database.displayName }} </span>
          <em v-else> {{ model.database.name }} </em>
        </span>
        <i class="fa fa-angle-right text-muted"> </i>
        <span v-if="model.table.displayName" class="data-schema-header--tblname"> {{ model.table.displayName }} </span>
        <em v-else class="data-schema-header--tblname"> {{ model.table.name }} </em>
      </div>
      <div class="d-flex">
        <DiIconTextButton :id="genBtnId('add-column')" class="" title="Add column" @click="fieldManagement.addColumn()">
          <i class="di-icon-add icon-title"></i>
        </DiIconTextButton>
        <DiIconTextButton :id="genBtnId('cancel')" class="mr-2" title="Cancel" @click="handleCancel" />
        <DiIconTextButton :id="genBtnId('save')" title="Create" @click="handleSave">
          <i class="di-icon-save icon-title"></i>
        </DiIconTextButton>
      </div>
    </div>
    <FieldManagement :status="status.Loaded" ref="fieldManagement" :model="model" :view-mode="viewMode" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { DataSchemaModel, ViewMode } from '@/screens/data-management/views/data-schema/model';
import { Log } from '@core/utils';
import InputSetting from '@/shared/settings/common/InputSetting.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import Swal from 'sweetalert2';
import FieldManagement from '@/screens/data-management/views/data-schema/FieldManagement.vue';
import { cloneDeep } from 'lodash';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Status } from '@/shared';

@Component({
  components: {
    InputSetting,
    DiDatePicker,
    FieldManagement
  }
})
export default class FieldCreationManagement extends Vue {
  private readonly status = Status;

  @Prop({ type: Object, required: false })
  private readonly model?: DataSchemaModel;

  @Prop({ type: Number, required: false, default: ViewMode.ViewSchema })
  private readonly viewMode!: ViewMode;

  @Ref()
  private readonly fieldManagement!: FieldManagement;

  private async handleCancel() {
    try {
      const { isConfirmed } = await this.showEnsureModal(
        'It looks like you have been editing something',
        'If you leave before saving, your changes will be lost.',
        'Leave',
        'Cancel'
      );
      if (isConfirmed) {
        this.$emit('cancel');
      }
    } catch (ex) {
      Log.error(ex);
    }
  }

  private async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
    //@ts-ignore
    return this.$alert.fire({
      icon: 'warning',
      title: title,
      html: html,
      confirmButtonText: confirmButtonText ?? 'Yes',
      showCancelButton: true,
      cancelButtonText: cancelButtonText ?? 'No'
    });
  }
  @Track(TrackEvents.TableSubmitCreate, {
    table_name: (_: FieldCreationManagement) => _.model?.table?.displayName,
    database_name: (_: FieldCreationManagement) => _.model?.database?.name
  })
  private async handleSave() {
    try {
      const tableToEdit = await this.fieldManagement.getEditedTable();
      if (tableToEdit) {
        ///Create
        const tableCreated = await DataManagementModule.createTable(tableToEdit);
        await DatabaseSchemaModule.reload(tableCreated.dbName);
        this.$emit('created', tableCreated);
      }
    } catch (e) {
      Log.error(e);
      await Swal.fire({
        icon: 'error',
        title: 'Create Table Error',
        html: e.message
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.field-creation-container {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  text-align: left;

  .data-schema-title {
    margin: 16px 0;

    .di-btn-group {
      ::v-deep {
        .btn-secondary {
          width: 130px !important;
        }
      }
    }
  }

  .data-schema-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    margin-bottom: 1rem;

    .data-schema-header--dbname {
      margin: 0 10px;
      font-weight: 500;
    }

    .data-schema-header--tblname {
      margin: 0 10px;
    }
  }

  .data-schema-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    .data-schema-info--body {
      flex: 1;
      overflow: hidden;

      //// remove: header color
      //--header-color: unset;

      .result-table ::v-deep .empty-widget {
        background-color: var(--panel-background-color);
      }

      .result-table ::v-deep .table-chart-container .table-chart-pagination-content {
        --header-background-color: var(--accent);
        //--header-color: var(--text-color);
      }
    }
  }

  ::v-deep {
    .table-container,
    .infinite-table {
      overflow: auto;
      box-shadow: none !important;
      border-radius: 4px;
      max-height: 100%;

      table {
        margin-bottom: 0 !important;
        border-collapse: separate;
        border-spacing: 0;

        td,
        th {
          padding: 4px 12px;
          font-size: 14px;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 1;

          th {
            border-top: none;
            background-color: var(--header-background-color, #131d26);
            color: var(--table-header-color, #ffffff);
          }
        }

        tbody {
          tr {
            &.even td {
              background-color: var(--row-even-background-color, #00000033);
              color: var(--row-even-color, #ffffffcc);
            }

            &.odd td {
              background-color: var(--row-odd-background-color, #0000001a);
              color: var(--row-odd-color, #ffffffcc);
            }
          }
        }

        tr {
          th,
          td {
            border: none;
            border-right: 1px solid #ffffff14;
            border-bottom: 1px solid #f0f0f0;
          }

          code {
            color: #ea6b6b;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          .cell-20 {
            width: 20%;
          }

          .cell-15 {
            width: 15%;
          }

          .cell-5 {
            width {
              width: 5%;
            }
          }

          .default-value-cell {
            .input-calendar {
              width: 100%;
              font-size: 0.875rem;
              height: calc(1.5em + 0.75rem);

              &::placeholder {
                font-size: 0.75rem;
              }
            }
          }

          .dropdown-cell {
            .select-container > .relative > span > button {
              height: 34px;

              > div .dropdown-input-placeholder {
                z-index: 0;
              }
            }
          }
        }

        tr:last-child:first-child {
          th,
          td {
            border: none;
            border-right: 1px solid #ffffff14;
          }
        }
      }
    }

    .table-chart-container {
      padding: 0;

      .table-chart-header-content {
        display: none;
      }

      //.table-chart-table-content {
      //  background: var(--panel-background-color);
      //}
    }
  }
}
</style>
