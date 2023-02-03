<template>
  <div v-if="userData" class="user-status-item">
    <UserItem :user-data="userData.user"></UserItem>
    <DiDropdown
      :id="genDropdownId('status', id)"
      boundary="window"
      v-model="currentValue"
      :appendAtRoot="true"
      :data="selectOptions"
      value-props="type"
    ></DiDropdown>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import UserItem from '@/shared/components/UserItem.vue';
import { ActionType, PERMISSION_ACTION_NODES, ResourceType } from '@/utils/PermissionUtils';
import { ActionNode } from '@/shared';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';

@Component({
  components: { UserItem }
})
export default class UserItemStatus extends Vue {
  currentValue!: string;

  @Prop({ required: true, type: Object })
  private readonly userData!: SharedUserInfo;

  @Prop({ required: true, type: String })
  private readonly resourceType!: ResourceType;

  @Prop({ required: true, type: String })
  private readonly resourceId!: string;

  @Prop({ required: true, type: [String, Number] })
  private readonly organizationId!: string;

  @Prop({ required: true, type: String })
  private readonly id!: string;

  constructor() {
    super();
    this.currentValue = PermissionProviders.getActionType(this.organizationId, this.resourceType, this.resourceId, this.userData.permissions);
  }

  private get selectOptions(): ActionNode[] {
    return PERMISSION_ACTION_NODES;
  }

  @Watch('currentValue')
  private handleActionTypeChanged(newValue: ActionType) {
    this.$emit('onActionTypeChanged', newValue);
  }
}
</script>

<style lang="scss">
.user-status-item {
  align-items: center;
  display: flex;
  overflow: hidden;

  > .user-item {
    flex: 3;
    overflow: hidden;
    margin-right: 8px;
  }

  > .select-container {
    flex: 1;
  }
}
</style>
