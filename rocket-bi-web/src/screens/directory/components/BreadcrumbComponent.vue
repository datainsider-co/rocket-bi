<template>
  <div v-if="!isMobile" class="breadcrumb-container">
    <template v-for="(item, index) in currentBreadCrumbs">
      <div :key="index" class="breadcrumb-container-item">
        <BreadcrumbIcon icon-size="16"></BreadcrumbIcon>
        <template v-if="item.disabled">
          <a class="max-width-to-hidden-text" disabled href="javascript:void(0);">{{ item.text }}</a>
        </template>
        <template v-else>
          <router-link :title="item.text" :to="item.to">
            {{ item.text }}
          </router-link>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Breadcrumbs } from '@/shared/models';
import { BreadCrumbUtils } from '@/utils/BreadCrumbUtils';
import { ChartUtils, ListUtils } from '@/utils';
import { Log } from '@core/utils';

@Component
export default class BreadcrumbComponent extends Vue {
  @Prop({ required: true, type: Array, default: () => [] })
  private readonly breadcrumbs!: Breadcrumbs[];

  @Prop({ required: false, type: Number })
  private readonly maxItem!: number;

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get currentBreadCrumbs(): Breadcrumbs[] {
    if (this.maxItem && this.breadcrumbs.length > this.maxItem) {
      return this.buildShortBreadCrumbs(this.breadcrumbs, this.maxItem);
    } else {
      return this.breadcrumbs;
    }
  }

  private buildShortBreadCrumbs(breadcrumbs: Breadcrumbs[], maxItem: number) {
    return [BreadCrumbUtils.defaultBreadcrumb(), ...breadcrumbs.slice(breadcrumbs.length - maxItem)];
  }
}
</script>

<style lang="scss">
.breadcrumb-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.17;
  letter-spacing: 0.2px;
  flex-wrap: nowrap;

  &-item {
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    max-width: 200px;
    min-width: 40px;

    &:last-child {
      max-width: unset;
      > a {
        font-weight: normal;
        color: var(--secondary-text-color);
        cursor: default;
      }
    }

    //margin-left: 8px;
    //color: red;
    > * {
      margin-left: 8px;
    }

    > a {
      flex: 1;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      color: var(--text-color);
      text-decoration: none;
      padding: 0;
      font-size: 24px;
      font-weight: 500;
      font-stretch: normal;
      font-style: normal;
      line-height: 1.17;
      letter-spacing: 0.2px;
    }
  }
}
</style>
