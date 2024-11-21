<template>
  <LayoutContent>
    <LayoutHeader title="Your Profile" icon="di-icon-user-profile-2"></LayoutHeader>
    <div class="layout-content-panel current-user--body">
      <div class="current-user--body--header" ref="currentUserBody">
        <div class="current-user--body--header--title">
          Information Detail
        </div>
        <div class="current-user--body--header--actions">
          <div class="current-user--body--header--actions--edit">
            <DiButton title="Edit Profile" @click="showEditingModal">
              <i class="di-icon-edit"></i>
            </DiButton>
          </div>
        </div>
      </div>
      <div class="current-user--body--content">
        <StatusWidget class="user-status-loading" :status="status" :error="errorMessage" @retry="loadUserProfile">
          <vuescroll :ops="verticalScrollConfig">
            <PropertyListing class="current-user--body--content--properties" :property-listing-items="userProfileProperties" />
          </vuescroll>
        </StatusWidget>
      </div>
    </div>
    <UserProfileEditingModal ref="userProfileEditingModal" :userProfile="userProfile" @updated="handleUpdateUserProfile"></UserProfileEditingModal>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Status, VerticalScrollConfigs } from '@/shared';
import { DataManager, UserProfileService } from '@core/common/services';
import { Di } from '@core/common/modules';
import { Gender, UserGenders, UserProfile } from '@core/common/domain';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import UserProfileEditingModal from '@/screens/current-user/components/UserProfileEditingModal.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import PropertyListing, { PropertyListingItem } from '@/screens/current-user/components/PropertyListing.vue';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: { PropertyListing, UserProfileEditingModal, StatusWidget, LayoutContent, LayoutHeader }
})
export default class UserProfileComponent extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private userProfile: UserProfile | null = null;
  private status: Status = Status.Loaded;
  private errorMessage = '';

  @Inject
  private readonly userProfileService!: UserProfileService;

  @Ref()
  private readonly userProfileEditingModal!: UserProfileEditingModal;

  private get name(): string {
    return this.userProfile?.getName ?? 'Unknown';
  }

  private defaultAvatar(): string {
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.name) || '';
  }

  private get userAvatar(): string {
    return this.userProfile?.avatar || this.defaultAvatar();
  }

  private get userProfileProperties(): PropertyListingItem[] {
    const defaultProperties: PropertyListingItem[] = [
      {
        title: 'Your Avatar',
        imgSrc: this.userAvatar,
        defaultImgSrc: this.userProfile?.defaultAvatar
      },
      {
        title: 'Full Name',
        value: this.userProfile?.fullName,
        isBoldText: true
      },
      {
        title: 'Gender',
        value: this.userProfile?.displayGender
      },
      {
        title: 'Date Of Birth',
        value: this.userProfile?.displayDateOfBirth
      },
      {
        title: 'Email',
        value: this.userProfile?.email
      },
      {
        title: 'Phone',
        value: this.userProfile?.mobilePhone
      }
    ];

    const extraProperties: PropertyListingItem[] = [];
    if (this.userProfile?.properties) {
      for (const key in this.userProfile?.properties) {
        extraProperties.push({ title: this.userProfile.displayExtraFieldName(key), value: this.userProfile.properties[key] });
      }
    }
    return defaultProperties.concat(extraProperties);
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }

  showError(message: string) {
    this.status = Status.Error;
    this.errorMessage = message;
  }

  private async loadUserProfile() {
    try {
      this.showLoading();
      this.userProfile = await this.userProfileService.getMyProfile();
      AuthenticationModule.setUserProfile(this.userProfile);
      this.showLoaded();
    } catch (e) {
      Log.error('CurrentDetailUser::loadUserProfile::error::', e.message);
      this.showError(e.message);
    }
  }

  mounted() {
    this.loadUserProfile();
  }

  private handleUpdateUserProfile(userProfile: UserProfile) {
    this.userProfile = userProfile;
    AuthenticationModule.setUserProfile(this.userProfile);
  }

  @Track(TrackEvents.EditMyProfile)
  private showEditingModal() {
    this.userProfileEditingModal.show();
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.current-user {
  &--header {
    display: flex;
    align-items: center;

    i {
      font-size: 24px;
      margin-right: 16px;
    }

    &--title {
      color: var(--text-color);
      @include regular-text();
      font-size: 24px;
      line-height: 28px;
      font-weight: 500;
    }
  }

  &--body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 24px;

    &--header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      &--title {
        @include regular-text-14();
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--text-color);
      }
    }

    &--content {
      height: calc(100% - 46px);

      &--properties {
        max-height: calc(100% - 46px);
      }
    }
  }
}
</style>
