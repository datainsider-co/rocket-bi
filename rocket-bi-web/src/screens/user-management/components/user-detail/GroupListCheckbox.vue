<template>
  <div>
    <div class="title" @click="togglePrivilegesForm">
      <img :class="{ rotateChange: !isShowListCheckbox }" src="@/assets/icon/ic-16-arrow-down.svg" alt="" />
      {{ group.groupName }}
    </div>
    <CollapseTransition v-show="isShowListCheckbox" :delay="5000" easing="ease-in-out">
      <div class="list-checkbox">
        <div class="list-checkbox-container">
          <b-form-checkbox v-if="group.hasSudoPermission" class="select-all" v-model="isSelectedAll" value="true" :unchecked-value="false">
            All
          </b-form-checkbox>
          <MultiSelection
            :id="id"
            class="multi-selection"
            :model="selectedItems"
            :options="group.permissions"
            key-label="name"
            key-field="permission"
            @selectedColumnsChanged="changePermissions"
          ></MultiSelection>
        </div>
      </div>
    </CollapseTransition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { CollapseTransition } from 'vue2-transitions';
import { PermissionGroup } from '@core/admin/domain/permissions/PermissionGroup';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

@Component({
  components: {
    CollapseTransition
  }
})
export default class GroupListCheckbox extends Vue {
  @Prop({ required: true, type: Object })
  private readonly group!: PermissionGroup;

  @Prop({ required: true })
  private readonly selectedItems!: string[];

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowAllCheckbox!: boolean;

  @Prop()
  private readonly id!: string;

  private isShowListCheckbox = true;
  private isSelectedAll = this.group.isSudoPermission(this.selectedItems);

  get isAllPermissionChecked(): boolean {
    const permissions: string[] = this.group.getPermissions();
    return permissions.every(item => this.selectedItems.includes(item));
  }

  @Watch('isSelectedAll')
  onSelectAllChanged(isSelectedAll: boolean) {
    if (this.isAllPermissionChecked && !isSelectedAll) {
      const allPermissions: string[] = this.group.getAllPermissions();
      const newPermissions: string[] = this.selectedItems.filter(item => !allPermissions.includes(item));
      this.changePermissions(newPermissions);
      this.isSelectedAll = false;
    } else if (!this.isAllPermissionChecked && isSelectedAll) {
      const allPermissions: string[] = [...this.selectedItems, ...this.group.getAllPermissions()];
      this.changePermissions(allPermissions);
    }
  }

  @Watch('isAllPermissionChecked')
  handleCheckedAllPermissions(isAllPermissionChecked: boolean) {
    if (isAllPermissionChecked && !this.isSelectedAll) {
      this.isSelectedAll = true;
      const allPermissions: string[] = [...this.selectedItems, ...this.group.getAllPermissions()];
      this.changePermissions(allPermissions);
    } else if (!isAllPermissionChecked && this.isSelectedAll) {
      const sudoPermissions: string[] = this.group.getSudoPermissions();
      const newPermissions: string[] = this.selectedItems.filter(item => !sudoPermissions.includes(item));
      this.changePermissions(newPermissions);
      this.isSelectedAll = false;
    }
  }

  private togglePrivilegesForm() {
    this.isShowListCheckbox = !this.isShowListCheckbox;
  }

  private changePermissions(newPermissions: string[]) {
    const isSame: boolean =
      ListUtils.isEmpty(ListUtils.diff(newPermissions, this.selectedItems)) && ListUtils.isEmpty(ListUtils.diff(this.selectedItems, newPermissions));
    if (isSame) {
      return;
    } else {
      const permissionSet: Set<string> = new Set(newPermissions);
      this.$emit('change', Array.from(permissionSet));
    }
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
