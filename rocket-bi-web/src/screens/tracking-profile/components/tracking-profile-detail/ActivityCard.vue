<template>
  <div class="activity-card" :style="backgroundColorVariables">
    <div class="activity-card-header">
      <img src="@/assets/icon/ic-mail.svg" alt="Mail" />
      <span class="activity-card-title">{{ data.title }}</span>
      <span class="activity-card-time">{{ data.time }}</span>
    </div>
    <div class="activity-card-body">
      <span class="activity-card-body-text">{{ activityDescription }}</span>
      <a class="activity-card-body-link" :href="event.url">{{ getPageTitle }}</a>
      <span class="activity-card-body-trailing-text">{{ activityDuration }}</span>
    </div>
    <div class="activity-card-footer" v-if="event.status">
      <span class="dot"></span>
      <span class="status">{{ event.status }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SocialCard from '@/screens/tracking-profile/components/tracking-profile-detail/SocialCard.vue';
import ContactDetailsForm from '@/screens/tracking-profile/components/tracking-profile-detail/ContactDetailsForm.vue';
import { ActivityGroupInfo } from '@/shared/interfaces';
import { SystemEvents } from 'di-web-analytics/dist/domain/system_events';
import moment from 'moment';

@Component({
  components: {
    SocialCard,
    ContactDetailsForm
  }
})
export default class ActivityCard extends Vue {
  @Prop({ required: true })
  data!: ActivityGroupInfo;

  @Prop({ type: String, required: true })
  backgroundColor!: string;

  constructor() {
    super();
  }

  get getPageTitle() {
    switch (this.data.eventName) {
      case SystemEvents.PAGE_VIEW:
        return this.event.screenName ?? '';
      default:
        return this.event.url ? this.getShortName(this.event.url) : '';
    }
  }

  get activityDescription() {
    switch (this.data.eventName) {
      case SystemEvents.PAGE_VIEW:
        return `${this.getUserDisplayName()} has viewed a page`;
      default:
        return `${this.getUserDisplayName()} has been ${this.event.displayName} at`;
    }
  }

  get activityDuration() {
    if ((this.data?.event?.duration ?? 0) > 0) {
      return ` in ${moment.duration(this.data.event.duration).humanize()}`;
    }
    return '';
  }

  get event() {
    return this.data.event;
  }

  get backgroundColorVariables() {
    return {
      '--activity-card-background-color': this.backgroundColor
    };
  }

  getShortName(url: string) {
    return url.split('/').pop();
  }

  getUserDisplayName(): string {
    return this.data.userDetail?.fullName ?? this.data.username ?? '';
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~bootstrap/scss/bootstrap-grid';

.activity-card {
  display: flex;
  flex-direction: column;
  background-color: var(--activity-card-background-color);
  border-radius: 4px;
  padding: 24px;

  .activity-card-header {
    order: 0;
    display: flex;
    flex-direction: row;

    img {
      order: 0;
    }

    .activity-card-title {
      order: 1;
      @include bold-text;
      font-size: 16px;
      letter-spacing: 0.27px;
      text-align: left;
      margin-left: 24px;
      align-self: center;
    }

    .activity-card-time {
      order: 2;
      @include regular-text;
      opacity: 0.8;
      font-size: 14px;
      letter-spacing: 0.23px;
      align-self: center;
      margin-left: auto;
      @media screen and (max-width: 500px) {
        display: none;
      }
    }
  }

  .activity-card-body {
    order: 1;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-left: 47px;
    margin-top: 12px;
    margin-bottom: 12px;

    .activity-card-body-text {
      order: 0;
      @include regular-text;
      opacity: 0.8;
      font-size: 14px;
      letter-spacing: 0.23px;
      text-align: left;

      span {
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }

    .activity-card-body-link {
      order: 1;
      @include regular-text;
      font-size: 14px;
      color: var(--accent);
      letter-spacing: 0.2px;
      margin-left: 8px;
      text-align: left;

      a {
        display: inline-block;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }

    .activity-card-body-trailing-text {
      order: 2;
      @include regular-text;
      opacity: 0.8;
      font-size: 14px;
      letter-spacing: 0.23px;
      text-align: left;
      margin-left: 8px;

      span {
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }

    .activity-card-body-link:hover {
      cursor: pointer;
    }
  }

  .activity-card-footer {
    order: 2;
    display: flex;
    flex-direction: row;
    margin-left: 47px;

    .dot {
      width: 8px;
      height: 8px;
      margin: 3px 8px 3px 0;
      border-radius: 50%;
      background-color: var(--success);
    }

    .status {
      @include regular-text;
      opacity: 0.5;
      font-size: 12px;
      letter-spacing: 0.2px;
      text-align: left;
    }
  }
}
</style>
