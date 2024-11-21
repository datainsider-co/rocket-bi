<template>
  <StatusWidget :class="statusClass" :error="errorMsg" :status="status" class="lazy-listing" @retry="handleRetry">
    <template #default>
      <template v-if="isEmpty">
        <slot name="empty">
          <div class="d-flex align-self-center h-100">
            <span class="text-center">There is not any dashboard to drill through</span>
          </div>
        </slot>
      </template>
      <template v-else>
        <vuescroll @handle-scroll="handleScroll" :ops="lazyScrollOptions">
          <DataListing :keyForDisplay="labelProp" :keyForValue="valueProp" :records="data" @onClick="emitClickItem" />
        </vuescroll>
      </template>
    </template>
  </StatusWidget>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status, VerticalScrollConfigs } from '@/shared';
import DataListing from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DataListing.vue';
import { DashboardListingHandler } from '@/screens/dashboard-detail/components/drill-through/ListingHandler';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

@Component({
  components: { DataListing, StatusWidget }
})
export default class LazyListing extends Vue {
  private status = Status.Loading;
  private errorMsg = '';
  private data: any[] = [];

  private readonly lazyScrollOptions = VerticalScrollConfigs;

  @Prop({ required: false, type: String, default: 'label' })
  private readonly labelProp!: string;

  @Prop({ required: true })
  private readonly listingHandler!: DashboardListingHandler<any>;

  @Prop({ required: false, type: String, default: 'id' })
  private readonly valueProp!: string;

  @Prop({ default: 0.8, type: Number })
  private positionLoadMore!: number;

  private get statusClass(): any {
    return {
      'lazy-loaded': this.status === Status.Loaded
    };
  }

  private get isEmpty(): boolean {
    return ListUtils.isEmpty(this.data);
  }

  mounted() {
    this.handleLoadData();
  }

  handleScroll(vertical: { process: number }) {
    const { process } = vertical;
    if (process > this.positionLoadMore) {
      this.handleLoadMore();
    }
  }

  private async handleRetry() {
    try {
      this.showLoading();
      this.data = await this.listingHandler.reload();
      this.hideLoading();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      Log.error('handleRetry::ex', exception);
      this.showError(exception.message);
    }
  }

  private async handleLoadMore() {
    try {
      this.data = await this.listingHandler.loadMore();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      Log.error('handleLoadMore::ex', exception);
      this.showError(exception.message);
    }
  }

  private async handleLoadData() {
    try {
      this.showLoading();
      this.data = await this.listingHandler.search('');
      this.hideLoading();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      Log.error('handleLoadData::ex', exception);
      this.showError(exception.message);
    }
  }

  private showLoading() {
    this.status = Status.Loading;
    this.errorMsg = '';
  }

  private hideLoading() {
    this.status = Status.Loaded;
    this.errorMsg = '';
  }

  private showError(errorMsg: string) {
    this.status = Status.Error;
    this.errorMsg = errorMsg;
  }

  @Emit('onClick')
  private emitClickItem(item: any): void {
    return item;
  }
}
</script>

<style lang="scss">
.lazy-listing {
  h4 {
    display: block;
    font-size: 14px;
    font-stretch: normal;
    font-style: normal;
    font-weight: normal;
    line-height: normal;
    opacity: 0.8;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
  }
}

.lazy-loaded {
  overflow: hidden;
  position: relative;
  display: flex;
}
</style>
