<template>
  <div class="cdp-selection-listing" :class="{ 'cdp-selection-listing-empty': !isNotEmpty }">
    <StatusWidget
      class="cdp-selection-listing-loading"
      v-if="status !== Status.Loaded"
      :status="status"
      :error="errorMsg"
      @retry.stop="() => initData()"
    ></StatusWidget>
    <ul v-else class="list-events mb-0">
      <template v-if="isNotEmpty">
        <li v-if="isShowTitle" @click.stop class="list-events-title">{{ titleName }}</li>
        <li v-if="isShowAnyEvent">
          <slot name="any-event" :select="select"></slot>
        </li>
        <template v-for="event in filteredItems">
          <li @click.prevent="select(event)" :key="loader.getId(event)">
            <a href="#" class="list-events-item">
              <i class="di-icon-click"></i>
              {{ loader.getDisplayName(event) }}
            </a>
          </li>
        </template>
      </template>
      <template v-else>
        <EmptyWidget>
          <span>{{ emptyTitle }}</span>
        </EmptyWidget>
      </template>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { Status } from '@/shared';
import { StringUtils } from '@/utils/string.utils';
import { CdpSelectionLoader } from '@/screens/CDP/components/SelectStepPopover/CdpSelectionLoader';
import { Log } from '@core/utils';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';

@Component({
  components: {
    EmptyWidget
  }
})
export default class CdpSelectionListing<T> extends Vue {
  private readonly Status = Status;
  private status = Status.Loading;
  private errorMsg = '';

  @Prop({ required: false, type: String, default: '' })
  private readonly keyword!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowAnyEvent!: boolean;

  @Prop({ required: true, type: Object })
  private readonly loader!: CdpSelectionLoader<T>;

  @Prop({ required: false, type: String, default: '' })
  private readonly titleName!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowTitle!: boolean;

  @Prop({ required: false, type: String, default: 'List data is empty' })
  private readonly emptyTitle!: string;

  private data: T[] = [];

  private get isNotEmpty() {
    return this.isShowAnyEvent || this.filteredItems.length > 0;
  }

  mounted() {
    if (this.loader.isInit()) {
      this.status = Status.Loaded;
      this.data = this.loader.getData();
    } else {
      this.initData();
    }
  }

  private async initData() {
    try {
      this.status = Status.Loading;
      await this.loader.init();
      this.data = this.loader.getData();
      this.status = Status.Loaded;
    } catch (ex) {
      this.status = Status.Error;
      this.errorMsg = ex.message || `Error when load data, try again later!`;
    }
  }

  private get filteredItems(): T[] {
    return this.data.filter(item => StringUtils.isIncludes(this.keyword, this.loader.getDisplayName(item)));
  }

  @Emit('select')
  private select(event: T): T {
    return event;
  }
}
</script>

<style lang="scss">
.cdp-selection-listing {
  .cdp-selection-listing-loading {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 300px;
    padding: 8px;
    border-radius: 4px;
    align-items: center;
    justify-content: center;

    .status-loading {
      flex: 1;
    }
  }

  .list-events {
    $padding: 16px;
    list-style: none;
    padding: 0;
    margin-bottom: 16px !important;

    &.mb-0 {
      margin-bottom: 0px !important;
    }

    li {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 #{$padding/2};

      &:last-child .list-events-item {
        margin-bottom: #{$padding / 2};
      }
    }

    &-item {
      display: flex;
      align-items: center;
      width: 100%;
      color: var(--text-color);
      text-decoration: none;
      padding: #{$padding/2};

      [class^='di-icon-'] {
        width: 16px;
        display: inline-block;
        font-size: 16px;
        margin-right: 8px;
      }

      &:hover {
        background-color: var(--input-background-color);
        border-radius: 4px;
        text-decoration: none;
      }
    }

    &-title {
      font-weight: 500;
      text-transform: uppercase;
      padding: $padding $padding #{$padding/2} !important;
      position: sticky;
      width: 100%;
      top: 0;
      background: var(--white);
    }
  }

  &.cdp-selection-listing-empty {
    .empty-widget {
      padding: 8px;
      min-height: 160px;

      svg {
        width: 68px;
        height: 68px;
      }
    }
  }
}
</style>
