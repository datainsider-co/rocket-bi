<template>
  <b-modal ref="mdEditColumns" id="mdEditColumns" size="lg" centered>
    <template v-slot:modal-header>
      <h6 class="modal-header-text">Choose which columns you see</h6>
      <p class="h5 mb-2">
        <b-icon-x role="button" variant="light" @click="close"></b-icon-x>
      </p>
    </template>
    <template v-slot:default="">
      <div class="edit-columns-body">
        <div class="edit-columns-body-left">
          <b-input-group class="search-input">
            <b-input-group-prepend>
              <img src="@/assets/icon/ic_search.svg" alt="Search" />
            </b-input-group-prepend>
            <b-form-input type="text" placeholder="Search By Name, Id, Email …" v-model="searchText"></b-form-input>
          </b-input-group>
          <div class="checkbox-columns-list-container">
            <vuescroll :ops="scrollOption" class="scroll-left-area">
              <MultiSelection
                :id="genMultiSelectionId('editable-column')"
                class="multi-selection"
                :model="selectedColumns"
                :options="checkboxListColumns"
                @selectedColumnsChanged="selectedColumnsChanged"
              ></MultiSelection>
            </vuescroll>
          </div>
          <div class="property-question">
            <span
              >Don’t see the property you’re looking for?
              <router-link to="/chart-builder">
                Create a property
              </router-link>
            </span>
          </div>
        </div>
        <div class="edit-columns-body-right">
          <label>Selected columns ({{ countOfColumns }})</label>
          <vuescroll ref="vsSelectedColumns" :ops="scrollOption" class="scroll-right-area">
            <draggable :list="listColumnsForDragDrop" class="selected-columns-list-container" @start="dragging = true" @end="dragging = false">
              <transition-group type="transition" name="flip-list">
                <div class="selected-columns-list-item d-flex align-center" v-for="element in listColumnsForDragDrop" :key="element.value">
                  <img width="30" height="30" class="drag-icon mt-auto mb-auto" src="@/assets/icon/ic_drag.svg" alt="Drag" />
                  <span class="drag-text">{{ element.text }}</span>
                  <img
                    width="20"
                    height="20"
                    class="remove-icon mt-auto mb-auto"
                    src="@/assets/icon/ic-12-close.svg"
                    alt="Remove"
                    @click="removeColumn(element)"
                  />
                </div>
              </transition-group>
            </draggable>
          </vuescroll>
        </div>
      </div>
    </template>
    <template v-slot:modal-footer>
      <div class="modal-footer-container">
        <b-button class="button cancel-button" variant="secondary" @click="close">
          Cancel
        </b-button>
        <b-button class="button apply-button" variant="primary" @click="apply">
          Apply
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import draggable from 'vuedraggable';
import vuescroll, { Config } from 'vuescroll';
import { BModal } from 'bootstrap-vue';
import { DefaultScrollConfig, Stores } from '@/shared';
import { mapState } from 'vuex';
import { Field, NestedColumn, TableSchema } from '@core/common/domain/model';
import { UserProfileCheckboxGroupOption } from '@/shared/models';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

@Component({
  components: { draggable, vuescroll },
  computed: {
    ...mapState(Stores.profileStore, ['profileSettingInfo'])
  }
})
export default class EditColumns extends Vue {
  @Ref()
  mdEditColumns!: BModal;

  @Ref()
  vsSelectedColumns!: any;

  profileSettingInfo!: TableSchema;

  dragging: boolean;
  searchText: string;
  selectedColumns: string[];
  checkboxListColumns: UserProfileCheckboxGroupOption[];
  listColumnsForDragDrop: UserProfileCheckboxGroupOption[];

  scrollOption: Config;

  constructor() {
    super();
    this.searchText = '';
    this.dragging = false;
    this.selectedColumns = [];
    this.checkboxListColumns = [];
    this.scrollOption = DefaultScrollConfig;
    this.listColumnsForDragDrop = [];
  }

  created() {
    const dataManager = Di.get(DataManager);
    const fields = dataManager.getUserProfileConfigColumns();
    const cols = fields.filter(x => !x.isHidden).map(x => x.name);
    this.selectedColumnsChanged(cols);
  }

  @Watch('profileSettingInfo', { immediate: true, deep: true })
  profileSettingInfoChanged() {
    if (this.profileSettingInfo) {
      this.checkboxListColumns = this.buildCheckboxListColumns(this.profileSettingInfo);
    }
  }

  @Watch('searchText')
  searchTextChanged() {
    this.checkboxListColumns = this.checkboxListColumns.filter(x => x.text.includes(this.searchText) || x.value.includes(this.searchText));
  }

  get countOfColumns() {
    if (this.selectedColumns) {
      return this.selectedColumns.length;
    }
    return 0;
  }

  showDialog() {
    this.mdEditColumns.show();
  }

  close() {
    this.mdEditColumns.hide();
  }

  apply() {
    const fields = this.listColumnsForDragDrop.map(x => {
      return new FieldDetailInfo(x.field, x.value, x.text, x.isNested);
    });
    const isHasUserId = fields.some(x => x.name === 'user_id');
    if (!isHasUserId) {
      const userIdColumn = this.checkboxListColumns.find(x => x.value === 'user_id');
      if (userIdColumn) {
        fields.push(new FieldDetailInfo(userIdColumn.field, userIdColumn.value, userIdColumn.text, userIdColumn.isNested, true));
      }
    }
    this.$emit('apply', fields);
    this.mdEditColumns.hide();
  }

  removeColumn(element: UserProfileCheckboxGroupOption) {
    this.selectedColumns = this.selectedColumns.filter(x => x !== element.value);
  }

  selectedColumnsChanged(value: string[]) {
    this.selectedColumns = value;
    this.buildListColumnsForDragDrop();
    this.scrollToTheEndOfSelectedColumnsArea();
  }

  private buildCheckboxListColumns(profileSettingInfo: TableSchema): UserProfileCheckboxGroupOption[] {
    const result: UserProfileCheckboxGroupOption[] = [];
    profileSettingInfo.columns.forEach(col => {
      if (col instanceof NestedColumn) {
        const nestedCols: UserProfileCheckboxGroupOption[] = [];
        col.nestedColumns.map(nestedCol => {
          const field = Field.new(profileSettingInfo.dbName, profileSettingInfo.name, `\`${col.name}.${nestedCol.name}\``, nestedCol.className);
          nestedCols.push(new UserProfileCheckboxGroupOption(nestedCol.name, nestedCol.displayName, true, field));
        });
        result.push(...nestedCols);
      } else {
        const field = Field.new(profileSettingInfo.dbName, profileSettingInfo.name, col.name, col.className);
        const option = new UserProfileCheckboxGroupOption(col.name, col.displayName, false, field);
        result.push(option);
      }
    });
    return result;
  }

  private buildListColumnsForDragDrop() {
    const unselectedColumns = this.listColumnsForDragDrop.filter(x => !this.selectedColumns.includes(x.value)).map(x => x.value);
    const newSelectedColumns = this.selectedColumns.filter(x => !this.listColumnsForDragDrop.some(y => y.value === x));

    if (unselectedColumns && unselectedColumns.length > 0) {
      this.removeUnselectedColumns(unselectedColumns);
    }

    if (newSelectedColumns && newSelectedColumns.length > 0) {
      this.addNewSelectedColumns(newSelectedColumns);
    }
  }

  private removeUnselectedColumns(unselectedColumns: string[]) {
    this.listColumnsForDragDrop = this.listColumnsForDragDrop.filter(x => !unselectedColumns.includes(x.value));
  }

  private addNewSelectedColumns(newSelectedColumns: string[]) {
    for (let index = 0; index < newSelectedColumns.length; index++) {
      const element = newSelectedColumns[index];
      const addingItem = this.checkboxListColumns.filter(x => x.value === element);
      addingItem.forEach(e => {
        this.listColumnsForDragDrop.push(e);
      });
    }
  }

  private scrollToTheEndOfSelectedColumnsArea() {
    this.vsSelectedColumns?.scrollBy(
      {
        dy: '150%'
      },
      500
    );
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/di-variables';

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.scroll-right-area {
  height: 300px !important;
  margin-top: 16px;
}

.scroll-left-area {
  height: 250px !important;

  .multi-selection {
    margin-bottom: 15px;
  }
}

.edit-columns-body {
  display: flex;
  flex-direction: row;
  height: 350px !important;
}

.edit-columns-body-left {
  order: 0;
  flex: 0 50%;
  display: flex;
  flex-direction: column;
  margin-right: 16px;
  align-items: flex-start;

  .search-input {
    order: 0;
    background-color: var(--secondary);
    height: 40px;
    border-radius: 4px;
    align-items: center;

    .input-group-prepend {
      margin-left: 16px;
      margin-right: 8px;
    }
  }

  .checkbox-columns-list-container {
    order: 1;
    margin-top: 20px;
    margin-bottom: 16px;
    width: 100%;
  }

  .property-question {
    order: 2;
  }
}

.edit-columns-body-right {
  order: 1;
  flex: 0 50%;
  display: flex;
  flex-direction: column;
  margin-left: 16px;

  .selected-columns-list-container {
    background-color: var(--primary);
    margin-right: 16px;
  }

  .selected-columns-list-item:first-child {
    margin-top: 0px;
  }

  .selected-columns-list-item:last-child {
    margin-bottom: 20px;
  }

  .selected-columns-list-item {
    display: flex;
    flex-direction: row;
    align-content: center;
    background-color: var(--secondary);
    margin: 12px 0px;
    border-radius: 4px;
    height: 42px;
    padding: 0px 8px;
    cursor: grab;

    .drag-icon {
      order: 0;
    }

    .drag-text {
      @include regular-text;
      order: 1;
      flex-grow: 2;
      font-size: 14px;
      letter-spacing: 0.2px;
      color: var(--text-color);
      text-align: left;
      align-self: center;
      margin-left: 8px;
    }

    .remove-icon {
      order: 2;
      cursor: pointer;
    }
  }
}

.modal-header-text {
  @include bold-text;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  color: var(--text-color);
}

.modal-footer-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  .button {
    width: 192px;
    height: 42px;
    border-radius: 4px;
  }

  .cancel-button {
    margin-right: 16px;
  }
}
</style>
