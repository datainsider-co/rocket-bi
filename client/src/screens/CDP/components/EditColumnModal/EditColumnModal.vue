<template>
  <b-modal
    ref="bModal"
    size="xl"
    modal-class="edit-column-modal"
    header-class="edit-column-modal-header"
    body-class="edit-column-modal-body"
    footer-class="edit-column-modal-footer"
    centered
  >
    <template #modal-header>
      <h6 class="modal-header-title">Choose which columns you see</h6>
      <div class="modal-header-close-icon btn-icon-border" @click="close">
        <i class="di-icon-close"></i>
      </div>
    </template>
    <template #default>
      <div class="edit-column-modal-body-left">
        <div class="edit-column-modal-body-left--search-input">
          <SearchInput hint-text="Search by column name" :text="keyword" @onTextChanged="handleSearchColumn" />
        </div>
        <div class="edit-column-modal-body-left--column-listing">
          <vuescroll :ops="scrollOption">
            <MultiSelection
              id="edit-column-modal-selection"
              key-field="name"
              key-label="prettyName"
              :model="selectedColumnNames"
              :options="columnOptions"
              @selectedColumnsChanged="handleSelectColumnChanged"
            >
            </MultiSelection>
          </vuescroll>
        </div>
      </div>
      <div class="edit-column-modal-body-right">
        <label>Selected columns ({{ selectedColumns.length }})</label>
        <template v-if="selectedColumns.length > 0">
          <vuescroll ref="scroller" :ops="scrollOption" style="position: unset">
            <draggable :list="selectedColumns">
              <transition-group type="transition" name="flip-list">
                <template v-for="column in selectedColumns">
                  <div class="selected-column-info" :key="column.name" :id="getColumnId(column.name)">
                    <DragIcon></DragIcon>
                    <div class="selected-column-info--display-name">{{ column.prettyName }}</div>
                    <div class="selected-column-info--remove-icon btn-icon-border" @click="removeColumn(column)">
                      <i class="di-icon-close"></i>
                    </div>
                  </div>
                </template>
              </transition-group>
            </draggable>
          </vuescroll>
        </template>
        <template v-else>
          <EmptyWidget>
            <span>No selected columns yet</span>
          </EmptyWidget>
        </template>
      </div>
    </template>
    <template #modal-footer>
      <DiButton title="Cancel" border @click="close"></DiButton>
      <DiButton title="Apply" primary @click="apply" :disabled="selectedColumns.length === 0"></DiButton>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import vuescroll, { Config } from 'vuescroll';
import { BModal } from 'bootstrap-vue';
import { VerticalScrollConfigs } from '@/shared';
import SearchInput from '@/shared/components/SearchInput.vue';
import MultiSelection from '@/shared/components/MultiSelection.vue';
import EmptyComponent from '@/screens/DataManagement/views/DatabaseManagement/EmptyComponent.vue';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import { EditColumnInfo } from '@/screens/CDP/components/EditColumnModal/EditColumnInfo.entity';
import { ListUtils } from '@/utils';
import { IdGenerator } from '@/utils/id_generator';
import { StringUtils } from '@/utils/string.utils';
import { cloneDeep } from 'lodash';

@Component({
  components: { EmptyWidget, EmptyComponent, SearchInput, draggable, vuescroll, MultiSelection }
})
export default class EditColumnModal extends Vue {
  private keyword = '';
  private selectedColumnNames: string[] = [];
  private columnsAsMap: Map<string, EditColumnInfo> = new Map<string, EditColumnInfo>();
  private selectedColumns: EditColumnInfo[] = [];

  @Ref()
  private readonly bModal!: BModal;

  @Ref()
  private readonly scroller!: any;

  private readonly scrollOption: Config = VerticalScrollConfigs;

  private get columnOptions(): EditColumnInfo[] {
    return Array.from(this.columnsAsMap.values()).filter(column => StringUtils.isIncludes(this.keyword, column.name));
  }

  show(columnsAsMap: Map<string, EditColumnInfo>, selectedColumns: EditColumnInfo[]) {
    this.keyword = '';
    this.columnsAsMap = cloneDeep(columnsAsMap);
    this.selectedColumnNames = selectedColumns.map(column => column.name);
    this.selectedColumns = cloneDeep(selectedColumns);
    this.bModal.show();
  }

  close() {
    this.bModal.hide();
  }

  apply() {
    this.$emit('apply', this.selectedColumns);
    this.bModal.hide();
  }

  removeColumn(column: EditColumnInfo) {
    this.selectedColumnNames = ListUtils.remove(this.selectedColumnNames, (columnName: string) => columnName === column.name);
    this.selectedColumns = this.getSelectedColumns(this.selectedColumnNames, this.columnsAsMap);
  }

  handleSelectColumnChanged(columnNames: string[]) {
    this.selectedColumnNames = columnNames;
    this.selectedColumns = this.getSelectedColumns(this.selectedColumnNames, this.columnsAsMap);

    this.scrollToEnd();
  }

  private scrollToEnd() {
    const column = ListUtils.getLast(this.selectedColumnNames);
    if (column) {
      const id = this.getColumnId(column);
      this.scroller?.scrollBy(`#${id}`, 500);
    }
  }

  private handleSearchColumn(text: string) {
    this.keyword = text;
  }

  private getColumnId(columnName: string): string {
    return IdGenerator.generateKey(['edit', columnName]);
  }

  private getSelectedColumns(selectedColumnNames: string[], columnsAsMap: Map<string, EditColumnInfo>): EditColumnInfo[] {
    return selectedColumnNames.map(name => columnsAsMap.get(name)).filter((column: EditColumnInfo | undefined): column is EditColumnInfo => !!column);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

.edit-column-modal {
  .edit-column-modal-header {
    padding: 24px 24px 0 24px !important;

    > .modal-header-title {
      @include bold-text();
      font-size: 24px;
      margin-bottom: 0;
    }

    > .modal-header-close-icon {
      width: 24px;
      height: 24px;
      display: flex;
      text-align: center;
      justify-content: center;
      align-items: center;

      &:hover {
        color: var(--white);
      }

      > i {
        font-size: 18px;
      }
    }
  }

  .edit-column-modal-body {
    padding: 24px !important;
    flex-direction: row;
    display: flex;
    height: 450px;

    &-left {
      flex: 0 50%;
      display: flex;
      flex-direction: column;
      margin-right: 16px;
      align-items: flex-start;

      &--search-input {
        display: flex;
        background: var(--primary);
        align-self: stretch;

        > div {
          margin: 0 8px;

          input {
            background: transparent;
            height: 42px;
            padding-right: 8px;
            color: var(--text-color);

            &::placeholder {
              color: var(--secondary-text-color) !important;
            }
          }
        }
      }

      &--column-listing {
        overflow: hidden;
        margin-top: 12px;
        flex: 1;
        align-self: stretch;
      }
    }

    &-right {
      flex: 0 50%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding-right: 16px;
      position: relative;

      label {
        @include bold-text-14();
        height: 42px;
        align-self: stretch;
      }

      .flip-list-move {
        transition: transform 0.5s;
      }

      .no-move {
        transition: transform 0s;
      }

      .selected-column-info {
        display: flex;
        flex-direction: row;
        background: var(--primary);
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 4px;
        padding: 8px;

        &--display-name {
          margin: 0 8px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          flex: 1;
        }

        &--remove-icon {
          width: 24px;
          height: 24px;
          display: flex;
          text-align: center;
          justify-content: center;
          align-items: center;

          &:hover {
            color: var(--white);
          }

          > i {
            font-size: 18px;
          }
        }
      }

      .selected-column-info + .selected-column-info {
        margin-top: 12px;
      }
    }
  }

  .edit-column-modal-footer {
    padding: 0 24px 24px 24px !important;

    > .di-button {
      width: 192px;
      height: 42px;
    }
  }
}
</style>
