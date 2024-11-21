<template>
  <div v-if="data" class="user-item-status-listing">
    <vuescroll :ops="scrollOptions">
      <div class="vuescroll-body">
        <div class="user-owner">
          <UserItem :user-data="owner" class="owner" userStatus="Owner"></UserItem>
          <span>Owner</span>
        </div>
        <UserItemStatus
          v-for="item in data"
          :id="item.user.email"
          :key="item.user.email"
          :organization-id="organizationId"
          :resourceId="resourceId"
          :resourceType="resourceType"
          :user-data="item"
          @onActionTypeChanged="actionType => handleActionTypeChanged(item, actionType)"
        ></UserItemStatus>
      </div>
    </vuescroll>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import UserItemStatus from './UserItemStatus.vue';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { Config } from 'vuescroll';
import { UserProfile } from '@core/common/domain/model';
import { ActionNode, VerticalScrollConfigs } from '@/shared';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';

@Component({
  components: { UserItemStatus }
})
export default class SharePermissionManager extends Vue {
  @Prop({ required: false, default: UserProfile.unknown() })
  private readonly owner?: UserProfile;
  @Prop({ required: true })
  private readonly data!: SharedUserInfo[];

  @Prop({ required: true })
  private readonly organizationId!: string;
  @Prop({ required: true })
  private readonly resourceType!: ResourceType;
  @Prop({ required: true })
  private readonly resourceId!: string;

  private readonly scrollOptions: Config = VerticalScrollConfigs;

  handleActionTypeChanged(userItemData: SharedUserInfo, actionType: ActionType) {
    this.$emit('onActionTypeChanged', userItemData, actionType);
  }
}
</script>

<style lang="scss">
.user-item-status-listing {
  margin-top: 24px;

  .vuescroll-body {
    max-height: calc(100vh - 64vh);

    > .user-owner {
      display: flex;
      justify-content: space-between;

      > div {
        flex: 1;
        overflow: hidden;
        margin-right: 16px;
      }

      > span {
        font-size: 16px;
        font-weight: normal;
        font-stretch: normal;
        font-style: normal;
        line-height: normal;
        letter-spacing: 0.27px;
        text-align: right;
        color: var(--secondary-text-color);
      }
    }

    > div + div {
      margin-top: 24px;
    }
  }
}
</style>
