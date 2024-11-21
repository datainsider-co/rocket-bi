<template>
  <div ref="divContactForm" class="user-profile-details-contact">
    <div v-if="profile" class="user-profile-details-contact-header">
      <img :src="profile.avatarUrl || defaultAvatar" alt="Avatar" @error="$event.target.src = defaultAvatar" />
      <span class="regular-text-24">{{ profile.fullName }}</span>
      <div class="social-info">
        <SocialCard :icon="'facebook.svg'" :name="'Facebook'" :url="profile.fb" />
        <SocialCard :icon="'twitter.svg'" :name="'Twitter'" :url="profile.twitter" />
        <SocialCard :icon="'zalo.svg'" :name="'Zalo'" :url="profile.zalo" />
      </div>
    </div>
    <div class="user-profile-details-contact-details">
      <FadeTransition>
        <div class="contact-details-actions" @click="toggleContactDetailsFrom">
          <b-icon-chevron-up v-if="isShowContactDetailsForm" style="color: #9799ac" />
          <b-icon-chevron-down v-else style="color: #9799ac" />
          <span class="details-actions-text">About this contact</span>
        </div>
      </FadeTransition>
      <CollapseTransition>
        <div class="contact-details-form" v-show="isShowContactDetailsForm">
          <ContactDetailsForm :maxSpanWidth="maxSpanWidth" v-if="profile" />
        </div>
      </CollapseTransition>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import SocialCard from '@/screens/tracking-profile/components/tracking-profile-detail/SocialCard.vue';
import ContactDetailsForm from '@/screens/tracking-profile/components/tracking-profile-detail/ContactDetailsForm.vue';
import { ProfileActivityModule } from '@/screens/tracking-profile/store/ProfileActivityStore';
import { TrackingProfileResponse } from '@core/tracking/domain/response/TrackingProfileResponse';

@Component({
  components: {
    SocialCard,
    ContactDetailsForm,
    CollapseTransition,
    FadeTransition
  }
})
export default class Contact extends Vue {
  isShowContactDetailsForm: boolean;
  defaultAvatar: string;

  private get trackingProfile(): TrackingProfileResponse {
    return ProfileActivityModule.trackingProfile!;
  }

  @Ref()
  divContactForm!: any;

  maxSpanWidth: number;

  constructor() {
    super();
    this.isShowContactDetailsForm = true;
    this.defaultAvatar = require('@/assets/icon/default-avatar.svg');
    this.maxSpanWidth = 200;
  }

  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    });
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  get profile() {
    return this.trackingProfile?.profile;
  }

  toggleContactDetailsFrom() {
    this.isShowContactDetailsForm = !this.isShowContactDetailsForm;
  }

  private onResize() {
    const { width } = this.divContactForm.getBoundingClientRect();
    this.maxSpanWidth = width - 100;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~bootstrap/scss/bootstrap-grid';

.user-profile-details-contact {
  display: flex;
  flex-direction: column;
  background-color: var(--user-profile-background-color);
  border-radius: 4px;
  height: 100%;
  width: 400px;

  @media all and (max-width: 880px) {
    flex-grow: 2;
  }

  .user-profile-details-contact-header {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    order: 0;
    justify-content: center;
    padding: 24px;

    img {
      height: 100px;
      width: 100px;
      border-radius: 50%;
      object-fit: contain;
    }

    span {
      margin-top: 8px;
    }

    .social-info {
      display: flex;
      flex-direction: row;
      margin-top: 24px;
    }
  }

  .user-profile-details-contact-details {
    display: flex;
    flex-direction: column;
    padding: 24px;

    .contact-details-actions {
      display: flex;
      flex-direction: row;
      height: 30px;

      svg {
        align-self: center;
      }

      .details-actions-text {
        @include regular-text;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.6px;
        margin-left: 8px;
        align-self: center;
      }
    }

    .contact-details-actions:hover {
      background-color: var(--primary);
      cursor: pointer;
      border-radius: 4px;

      span:hover {
        cursor: pointer;
      }
    }

    .contact-details-form {
      margin-top: 32px;
    }
  }
}
</style>
