<template>
  <div>
    <CollapseTransition>
      <div v-show="isHaveFilter" class="h-100">
        <div ref="containerRef" class="user-profile-filter-container">
          <div class="profile-filter-title">Filters ({{ filterQuantity }})</div>
          <vuescroll>
            <FadeTransition class="d-flex flex-wrap filter-listing-area" group>
              <DynamicFilterPanel
                v-for="(filter, index) in filters"
                :key="filter.id"
                :id="genFilterId(index)"
                :filter.sync="filter"
                class="filter-item"
                @onApplyFilter="applyFilterAt(index)"
                @onFilterStatusChanged="handleStatusChange(index, ...arguments)"
                @onRemove="removeFilterAt(index)"
                @onValuesChanged="handleValuesChange(index)"
              >
              </DynamicFilterPanel>
            </FadeTransition>
          </vuescroll>
        </div>
      </div>
    </CollapseTransition>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import DynamicFilterPanel from '@/shared/components/filters/DynamicFilterPanel/DynamicFilterPanel.vue';
import { DynamicFilter } from '@core/domain/Model';
import { ListUtils } from '@/utils';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import { IdGenerator } from '@/utils/id_generator';

@Component({
  components: {
    DynamicFilterPanel,
    CollapseTransition,
    FadeTransition
  }
})
export default class FilterBar extends Vue {
  @Prop({ required: true, type: Array })
  private readonly filters!: DynamicFilter[];

  @Ref()
  private readonly containerRef!: HTMLElement;

  private get filterQuantity(): number {
    return this.filters.length;
  }

  private get isHaveFilter(): boolean {
    return ListUtils.isNotEmpty(this.filters);
  }

  get height(): number {
    return this.containerRef.clientHeight;
  }

  @Emit('onRemoveAt')
  private removeFilterAt(index: number) {
    return index;
  }

  @Emit('onApplyFilter')
  private applyFilterAt(index: number): DynamicFilter {
    return this.filters[index];
  }

  @Emit('onStatusChange')
  private handleStatusChange(index: number, isEnable: boolean): DynamicFilter {
    return this.filters[index];
  }

  @Emit('onValuesChange')
  private handleValuesChange(index: number) {
    return this.filters[index];
  }

  // id pattern: filter-[FilterIndex]
  private genFilterId(filterIndex: number) {
    return IdGenerator.generateFilterId(filterIndex);
  }

  showFilter(filterIndex: number) {
    this.$nextTick(() => {
      // wait for animation adding completed
      setTimeout(() => {
        this.$root.$emit('bv::show::popover', this.genFilterId(filterIndex));
      }, 250);
    });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';

.user-profile-filter-container {
  align-items: center;
  display: flex;
  flex-direction: row;
  max-height: 120px;
  min-height: 60px;
  overflow: hidden;

  .profile-filter-title {
    @include regular-text();
    flex: none;
    opacity: 0.8;
    text-align: left;

    @include media-breakpoint-down(xs) {
      display: none;
    }
  }

  .filter-listing-area {
    margin-left: 12px;
    max-height: 120px;

    @media (max-width: 583px) {
      max-height: 60px;
    }

    > .filter-item {
      margin-bottom: 6px;
      margin-top: 6px;
    }

    .filter-item {
      margin-left: 12px;
    }
  }
}
</style>
