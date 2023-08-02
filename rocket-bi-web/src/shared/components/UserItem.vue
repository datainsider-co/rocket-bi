<template>
  <div v-if="userData" class="user-item" @click="handleClickUserItem">
    <div class="user-item--bar">
      <img :src="userAvatar" alt class="user-item--bar-avt" @error="$event.target.src = getDefaultUserAvatar()" />
      <div class="user-item--bar-info">
        <span class="username" :title="username">{{ username }}</span>
        <span :title="userData.email">{{ userData.email }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UserProfile } from '@core/common/domain/model';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

@Component
export default class UserItem extends Vue {
  @Prop({
    required: true,
    default: () => {
      return {};
    }
  })
  private readonly userData?: UserProfile;

  private get userAvatar(): string {
    return this.userData?.avatar || this.getDefaultUserAvatar();
  }

  private get username(): string {
    return this.userData?.getName ?? 'Unknown';
  }

  private getDefaultUserAvatar(): string {
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.username) || '';
  }

  private handleClickUserItem() {
    this.$emit('handleClickUserItem', this.userData);
  }
}
</script>

<style lang="scss">
.user-item {
  align-items: center;
  display: flex;
  height: 40px;

  &--bar {
    align-items: center;
    display: flex;
    flex: 1;
    overflow: hidden;

    &-avt {
      border-radius: 40px;
      height: 40px;
      margin-right: 12px;
      width: 40px;
    }

    &-info {
      display: flex;
      flex: 1;
      flex-direction: column;
      font-stretch: normal;
      font-style: normal;
      letter-spacing: 0.27px;
      line-height: normal;
      overflow: hidden;

      > span.username {
        color: var(--text-color);
        flex: 1;
        font-size: 16px;
        font-weight: 500;
      }

      > span {
        color: var(--secondary-text-color);
        flex: 1;
        font-size: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
