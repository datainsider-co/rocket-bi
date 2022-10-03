<template>
  <div class="page-view" :style="backgroundColorVariables">
    <div class="page-view-header">
      <img src="@/assets/icon/ic-page-view.svg" alt="Page view" />
      <span class="page-view-title">{{ data.title }}</span>
      <span class="page-view-time">{{ data.time }}</span>
    </div>
    <div class="page-view-body">
      <span class="page-view-body-text" v-if="isHasSubActivities">{{ content }}</span>
    </div>
    <div class="page-view-footer" v-if="isHasSubActivities">
      <div class="page-view-footer-title" @click="toggleSessionDetails">
        <b-icon-chevron-up v-if="isShowSessionDetails" style="color: #9799ac" />
        <b-icon-chevron-down v-else style="color: #9799ac" />
        <span>Session Details</span>
      </div>
      <CollapseTransition>
        <div class="page-view-footer-details" v-show="isShowSessionDetails">
          <Timeline :items="dataTimeline" :totalItems="totalSubs" :eventId="eventId" />
        </div>
      </CollapseTransition>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import vuescroll, { Config } from 'vuescroll';
import { CollapseTransition } from 'vue2-transitions';
import moment from 'moment';
import SocialCard from '@/screens/tracking-profile/components/tracking-profile-detail/SocialCard.vue';
import ContactDetailsForm from '@/screens/tracking-profile/components/tracking-profile-detail/ContactDetailsForm.vue';
import Timeline from '@/screens/tracking-profile/components/tracking-profile-detail/Timeline.vue';
import { ActivityGroupInfo, DefaultScrollConfig } from '@/shared';
import { SystemEvents } from 'di-web-analytics/dist/domain/system_events';

@Component({
  components: {
    SocialCard,
    ContactDetailsForm,
    CollapseTransition,
    Timeline,
    vuescroll
  }
})
export default class SessionActivityCard extends Vue {
  @Prop({ required: true })
  data!: ActivityGroupInfo;

  @Prop({ type: String, required: true })
  backgroundColor!: string;

  scrollOption: Config = DefaultScrollConfig;
  isShowSessionDetails: boolean;

  constructor() {
    super();
    this.isShowSessionDetails = true;
  }

  get backgroundColorVariables() {
    return {
      '--page-view-background-color': this.backgroundColor
    };
  }

  get isHasSubActivities() {
    return this.totalSubs > 0;
  }

  get totalSubs() {
    if (this.data.subActivities && this.data.subActivities.total) {
      return this.data.subActivities.total;
    }
    return 0;
  }

  get event() {
    return this.data.event;
  }

  get eventId() {
    return this.data.eventId;
  }

  get content() {
    return `viewed  ${this.totalSubs} pages ${this.activityDuration}`;
  }

  get activityDuration() {
    if ((this.data?.event?.duration ?? 0) > 0) {
      return ` in ${moment.duration(this.data.event.duration).humanize()}`;
    }
    return '';
  }

  getShortName(url: string) {
    return url.split('/').pop();
  }

  toggleSessionDetails() {
    this.isShowSessionDetails = !this.isShowSessionDetails;
  }

  get dataTimeline() {
    if (this.isHasSubActivities) {
      // @ts-ignore
      return this.data.subActivities.data.map((x, index) => {
        return {
          id: index,
          url: x.event.url,
          urlDisplay: this.getShortName(x.event.url || ''),
          title: x.title,
          time: moment(x.time).format('lll Z'),
          username: x.username
        };
      });
    }
    return [];
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.page-view {
  display: flex;
  flex-direction: column;
  background-color: var(--page-view-background-color);
  border-radius: 4px;
  padding: 24px;

  .page-view-header {
    order: 0;
    display: flex;
    flex-direction: row;

    img {
      order: 0;
    }

    .page-view-title {
      order: 1;
      @include bold-text;
      font-size: 16px;
      letter-spacing: 0.27px;
      text-align: left;
      margin-left: 24px;
      align-self: center;
    }

    .page-view-time {
      order: 2;
      @include regular-text;
      opacity: 0.8;
      font-size: 14px;
      letter-spacing: 0.23px;
      align-self: center;
      margin-left: auto;
    }
  }

  .page-view-body {
    order: 1;
    display: flex;
    flex-direction: row;
    margin-left: 47px;
    margin-top: 12px;
    margin-bottom: 12px;

    .page-view-body-link {
      order: 0;
      @include regular-text;
      font-size: 14px;
      color: var(--accent);
      letter-spacing: 0.2px;
      text-align: left;
    }

    .page-view-body-link:hover {
      cursor: pointer;
    }

    .page-view-body-text {
      order: 1;
      @include regular-text;
      opacity: 0.8;
      font-size: 14px;
      letter-spacing: 0.23px;
      text-align: left;
      margin-left: 4px;
    }
  }

  .page-view-footer {
    order: 2;
    display: flex;
    flex-direction: column;
    margin-left: 47px;

    .page-view-footer-title {
      order: 0;
      display: flex;
      flex-direction: row;
      height: 30px;

      svg {
        order: 0;
        align-self: center;
      }

      span {
        order: 1;
        @include regular-text;
        opacity: 0.8;
        font-size: 14px;
        letter-spacing: 0.23px;
        align-self: center;
        margin-left: 8px;
        text-align: left;
      }
    }

    .page-view-footer-title:hover {
      background-color: var(--secondary);
      cursor: pointer;
      border-radius: 4px;

      span:hover {
        cursor: pointer;
      }
    }

    .page-view-footer-details {
      order: 1;
      margin-left: 24px;
      margin-top: 16px;
    }
  }
}

.scroll-area {
  height: 200px !important;
  padding-bottom: 24px !important;
}
</style>
