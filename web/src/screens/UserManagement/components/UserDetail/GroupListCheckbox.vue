<template>
  <div>
    <div class="title" @click="togglePrivilegesForm">
      <img :class="{ rotateChange: !isShowListCheckbox }" src="@/assets/icon/ic-16-arrow-down.svg" alt="" />
      {{ group.groupName }}
    </div>
    <CollapseTransition v-show="isShowListCheckbox" :delay="5000" easing="ease-in-out">
      <div class="list-checkbox">
        <div class="list-checkbox-container">
          <b-form-checkbox v-if="group.allPermission.name" class="select-all" v-model="isSelectedAll" :value="true" :unchecked-value="false">
            {{ group.allPermission.name }}
          </b-form-checkbox>
          <MultiSelection
            :id="id"
            class="multi-selection"
            :model="selectedItems"
            :options="group.permissions"
            @selectedColumnsChanged="selectedColumnsChanged"
          ></MultiSelection>
        </div>
      </div>
    </CollapseTransition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { CheckboxGroupOption, GroupCheckboxOption } from '@/shared';
import { CollapseTransition } from 'vue2-transitions';
import { PermissionInfo } from '@core/admin/domain/permissions/PermissionGroup';

@Component({
  components: {
    CollapseTransition
  }
})
export default class GroupListCheckbox extends Vue {
  private isShowListCheckbox = true;

  @Prop({ required: true, type: Object })
  group!: GroupCheckboxOption;

  private allCheckboxValue = this.group.allPermission.permission;

  @Prop({ required: true })
  selectedItems!: string[];

  private isSelectedAll = !this.group.permissions.some(per => !this.selectedItems.includes(per['value']));

  @Prop({ required: false, type: Boolean, default: false })
  isShowAllCheckbox!: boolean;

  @Prop()
  id!: string;

  get isAllPermissionChecked(): boolean {
    let result = true;
    this.group.permissions.forEach(item => {
      if (!this.selectedItems.includes(item.value)) {
        result = false;
      }
    });
    return result;
  }

  @Watch('isSelectedAll')
  handleSelectAllChanged(isSelectedAll: boolean, oldIsSelectedAll: boolean) {
    if (isSelectedAll !== oldIsSelectedAll) {
      const newSelectedColumn: string[] = [...this.selectedItems];
      if (isSelectedAll) {
        this.$emit('handleChangeListCheckbox', [...new Set(this.handleAllSelected(newSelectedColumn))]);
      } else {
        this.$emit('handleChangeListCheckbox', [...new Set(this.handleAllUnSelected(newSelectedColumn))]);
      }
    }
  }

  handleAllSelected(newSelectedColumn: string[]): string[] {
    newSelectedColumn.push(this.allCheckboxValue);
    if (!this.isAllPermissionChecked) {
      this.group.permissions.forEach(item => {
        newSelectedColumn.push(item.value);
      });
    }
    return newSelectedColumn;
  }

  handleAllUnSelected(newSelectedColumn: string[]): string[] {
    const indexAll = newSelectedColumn.findIndex(item => item === this.allCheckboxValue);
    // Log.debug("inddexAll::", indexAll)
    if (indexAll !== -1) {
      newSelectedColumn.splice(indexAll, 1);
      // Log.debug("inddexAll::", test, newSelectedColumn)
    }
    if (this.isAllPermissionChecked) {
      this.group.permissions.forEach(item => {
        const index = newSelectedColumn.findIndex(x => x === item.value);
        if (index !== -1) {
          newSelectedColumn.splice(index, 1);
        }
      });
    }
    return newSelectedColumn;
  }

  //todo rename
  @Watch('isAllPermissionChecked')
  handleCheckedAllPermissions(newVal: boolean) {
    if (newVal && !this.isSelectedAll) {
      this.isSelectedAll = true;
    } else if (!newVal && this.isSelectedAll) {
      this.isSelectedAll = false;
    }
  }

  private togglePrivilegesForm() {
    this.isShowListCheckbox = !this.isShowListCheckbox;
  }

  private selectedColumnsChanged(values: string[]) {
    this.$emit('handleChangeListCheckbox', values);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.rotateChange {
  transform: rotate(180deg);
}

.title {
  padding: 10px 0 12px 16px;
  display: flex;
  font-size: 16px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: 0.27px;
  color: var(--secondary-text-color);
  align-items: center;
  cursor: pointer;

  img {
    margin-right: 12px;
    width: 16px;
    height: 16px;
  }
}
.list-checkbox {
  @include regular-text(0.27px, var(--secondary-text-color));
  font-size: 16px;
  margin-left: 44px;
  height: fit-content;
  padding-bottom: 20px;

  .select-all {
    ::v-deep {
      .custom-control {
        margin: 16px 0px;
      }

      input[type='checkbox'],
      input[type='checkbox'] + label {
        cursor: pointer;
      }

      .custom-control:last-child {
        margin-bottom: 20px;
      }

      .custom-control-label::before {
        background-color: transparent !important;
        border: 1px solid var(--secondary-text-color) !important;
        border-radius: 2px;
        background-image: unset !important;
      }

      .custom-control-input:checked ~ .custom-control-label::after {
        border-radius: 2px;
        font-family: 'data-insider-icon' !important;
        font-size: 14px;
        content: '\e931';
        background-color: var(--accent);
        background-image: unset !important;
        color: var(--white);
        text-align: center;
      }

      .custom-control-input:checked ~ .custom-control-label::before {
        border: none !important;
      }

      .custom-control-label {
        margin: 8px 0;
        @include regular-text;
        opacity: 0.8 !important;
        font-size: 16px !important;
        letter-spacing: 0.27px !important;
        color: var(--secondary-text-color) !important;
      }
    }
  }
}
</style>
