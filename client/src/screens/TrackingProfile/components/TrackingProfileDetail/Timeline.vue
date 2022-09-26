<template>
  <section class="timeline">
    <DynamicScroller
      v-if="hasItems"
      ref="timelineScroller"
      class="scroll-area"
      :items="internalItems"
      :min-item-size="20"
      key-field="id"
      v-on:scroll.native="handleScroll"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-active="active" :data-index="index">
          <div class="wrapper-timeline">
            <TimelineItem :item="item" :isLastChild="isLastChild(index)" />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import moment from 'moment';
import TimelineItem from '@/screens/TrackingProfile/components/TrackingProfileDetail/TimelineItem.vue';
import { ProfileActivityModule } from '@/screens/TrackingProfile/store/profile_activity.store';
import { GetUserActivityByEventIdRequest } from '@core/tracking/domain/request/event_tracking.request';
import { Log } from '@core/utils';

@Component({
  components: {
    TimelineItem
  }
})
export default class Timeline extends Vue {
  @Prop({
    type: Array,
    required: true,
    default: () => []
  })
  items!: any[];

  @Prop({
    type: Number,
    required: true,
    default: 0
  })
  totalItems!: number;

  @Prop({
    type: String,
    required: true,
    default: ''
  })
  eventId!: string;

  currentPage: number;
  currentSize: number;
  rowPerPage: number;
  internalItems: any[];

  constructor() {
    super();
    this.currentPage = 1;
    this.rowPerPage = 10;
    this.currentSize = this.rowPerPage;
    this.internalItems = this.items;
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.rowPerPage);
  }

  get hasItems() {
    return !!this.internalItems.length;
  }

  isLastChild(index: number) {
    if (index === this.internalItems.length - 1) {
      return true;
    }
    return false;
  }

  handleScroll(event: any) {
    const { scrollTop, clientHeight, scrollHeight } = event?.target;
    if (scrollTop + clientHeight >= scrollHeight) {
      if (this.currentPage < this.totalPages) {
        this.currentSize = this.currentPage * 10;
        this.currentPage += 1;
        this.handlePaging();
      }
    }
  }

  private async handlePaging() {
    const request = new GetUserActivityByEventIdRequest(this.eventId, this.currentSize, this.rowPerPage);
    await ProfileActivityModule.getUserActivitiesByEventId(request);

    const pagingData = ProfileActivityModule.userActivitiesByEventId.get(this.eventId);
    if (pagingData) {
      const currentIndex = this.internalItems.length;
      const mappedData = pagingData.data.map((x, index) => {
        return {
          id: currentIndex + index,
          url: x.event.url,
          urlDisplay: this.getShortName(x.event.url || ''),
          title: x.title,
          time: moment(x.time).format('lll Z'),
          username: x.username
        };
      });
      this.internalItems = [...this.internalItems, ...mappedData];
      Log.debug('this.internalItems', this.internalItems);
    }
  }

  private getShortName(url: string) {
    return url.split('/').pop();
  }
}
</script>

<style lang="scss" scoped>
.timeline {
  text-align: left;
  width: 100%;

  .wrapper-timeline {
    position: relative;
  }
}

.scroll-area {
  height: 200px !important;
}
</style>
