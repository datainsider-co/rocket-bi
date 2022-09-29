<template>
  <div v-if="userData" class="user-status-item">
    <UserItem :user-data="userData.user"></UserItem>
    <DiDropdown :id="genDropdownId('status', id)" boundary="window" v-model="currentValue" :appendAtRoot="true" :data="swmData" value-props="type"></DiDropdown>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import UserItem from '@/shared/components/UserItem.vue';
import { ResourceType } from '@/utils/PermissionUtils';
import { ActionNode } from '@/shared';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';

@Component({
  components: { UserItem }
})
export default class UserItemStatus extends Vue {
  @Prop({ required: true })
  userData!: SharedUserInfo;

  @Prop({ required: true })
  resourceType!: ResourceType;

  @Prop({ required: true })
  resourceId!: string;

  @Prop({ required: true })
  organizationId!: string;
  currentValue!: string;
  @Prop()
  swmData!: ActionNode[];
  @Prop({ required: true, type: Number })
  private readonly id!: number;

  constructor() {
    super();
    this.currentValue = this.permission;
  }

  //todo: get
  get permission() {
    // return this.userData.permissions[0];
    // Log.debug(
    //   'userStatusDAta::',
    //   this.userData.user.email,
    //   PermissionProviders.getActionType(this.organizationId, this.resourceType, this.resourceId, this.userData.permissions)
    // );
    return PermissionProviders.getActionType(this.organizationId, this.resourceType, this.resourceId, this.userData.permissions);
  }

  // get isPendingRemove() {
  //   //todo change remove value
  //   return this.currentValue === ActionType.none;
  // }

  @Watch('currentValue')
  handleStatusChange(newValue: string) {
    this.$emit('handleStatusChange', this.userData, newValue);
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
