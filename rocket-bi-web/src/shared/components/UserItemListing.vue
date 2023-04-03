<template>
  <BPopover
    :id="popoverId"
    :show.sync="syncedIsShowPopover"
    :target="target"
    class="popover-custom"
    custom-class="popover-custom"
    placement="bottom"
    triggers="blur"
  >
    <div :style="containerCSS()" class="user-item-listing">
      <div v-if="isEmptyData && isShowEmptyData" class="empty-data">
        <span class="unselectable block truncate font-normal">
          Sorry, no matching options.
        </span>
      </div>
      <template v-else>
        <div v-if="isShowStatusWidget" style="height: 200px">
          <StatusWidget :error="error" :status="status" class="status-widget"></StatusWidget>
        </div>
        <vuescroll :ops="userScrollOps">
          <div v-if="isLoaded" class="user-item-listing-scroller">
            <template v-for="(item, index) in data">
              <UserItem :key="index" :user-data="item" class="btn-ghost" @handleClickUserItem="handleClickUserItem"></UserItem>
            </template>
          </div>
        </vuescroll>
      </template>
    </div>
  </BPopover>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import UserItem from '@/shared/components/UserItem.vue';
import { UserProfile } from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status, VerticalScrollConfigs } from '@/shared';
import { ListUtils, StringUtils } from '@/utils';
import { Log } from '@core/utils';

@Component({
  components: { StatusWidget, UserItem }
})
export default class UserItemListing extends Vue {
  private readonly userScrollOps = VerticalScrollConfigs;

  @Prop()
  private readonly data!: UserProfile[];

  @Prop({ required: false, default: 'suggest-user-popover' })
  private readonly popoverId!: string;

  @PropSync('isShowPopover')
  private syncedIsShowPopover!: boolean;

  @Prop()
  private readonly target!: string;

  @Prop()
  private readonly status!: Status;

  @Prop()
  private readonly error!: string;

  @Prop({ type: Boolean, required: false, default: false })
  private readonly isShowEmptyData!: string;

  private get isEmptyData() {
    return ListUtils.isEmpty(this.data);
  }

  private get isLoaded(): boolean {
    return this.status === Status.Loaded;
  }

  private get isShowStatusWidget(): boolean {
    return this.status === Status.Loading || this.status === Status.Error;
  }

  private containerCSS() {
    const targetElement = document.body.querySelector(`#${this.target}`);
    if (targetElement) {
      const targetWidth = targetElement.clientWidth;
      Log.debug('UserItemListing::containerCSS::width::', targetWidth);
      return {
        width: StringUtils.toPx(targetWidth)
      };
    } else {
      return {};
    }
  }

  private handleClickUserItem(data: UserProfile) {
    this.$emit('handleClickUserItem', data);
    this.syncedIsShowPopover = false;
  }
}
</script>

<style lang="scss" scoped>
.popover-custom {
  background: none !important;
  border: none;
  max-width: unset;
  padding: 0 3px;
  top: -10px;
  //width: 100%;

  ::v-deep {
    .arrow {
      display: none;
    }
  }

  .user-item-listing {
    background-color: var(--menu-background-color) !important;
    border: var(--menu-border);
    border-radius: 4px;
    box-shadow: var(--menu-shadow);
    margin-top: -15.8px;
    padding: 0 !important;
    //width: 100%;

    .user-item-listing-scroller {
      max-height: calc(100vh - 64vh);

      > div {
        box-sizing: content-box;
        padding: 16px;
      }
    }

    .empty-data {
      padding: 16px;
    }
  }
}
</style>
