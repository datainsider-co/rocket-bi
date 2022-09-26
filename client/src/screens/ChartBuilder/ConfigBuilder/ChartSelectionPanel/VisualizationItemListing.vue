<template>
  <div class="select-type-chart-container">
    <div class="d-flex justify-content-between align-items-center w-100 title-panel">
      <div class="title unselectable">Type</div>

      <div class="ml5"></div>
      <button id="btnShowListVizItem" class="btn btn-see-more btn-ghost ml-auto" type="button" @click="handleShowSelectedVizItem">
        <div class="btn-title">View all</div>
        <img alt="More Option" src="@/assets/icon/ic-16-arrow-down.svg" />
      </button>
    </div>

    <div class="menu-select-scroll-container">
      <vuescroll ref="viewAllScroll" style="position: unset">
        <div class=" d-flex flex-row">
          <VisualizationItem
            v-for="(item, index) in items"
            :key="index"
            :isSelected="isSelected(item)"
            :item="item"
            class="menu-select-scroll-item"
            type="mini"
            @onClickItem="handleSelectItem"
          >
          </VisualizationItem>
        </div>
      </vuescroll>
    </div>
    <BPopover :show.sync="isShowSelectVizTypePanel" custom-class="popover-custom" placement="bottomLeft" target="btnShowListVizItem" triggers="click blur">
      <div class="dropdown-viz-items-popover-container">
        <vuescroll>
          <div class="dropdown-viz-items-scroll-container">
            <VisualizationItem
              v-for="(item, index) in items"
              :key="index"
              :isSelected="isSelected(item)"
              :item="item"
              class="dropdown-viz-item"
              type="default"
              @onClickItem="handleSelectItem"
            >
            </VisualizationItem>
          </div>
        </vuescroll>
      </div>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import { VisualizationItemData } from '@/shared';
import VisualizationItem from '@/screens/ChartBuilder/ConfigBuilder/ChartSelectionPanel/VisualizationItem.vue';
import vuescroll from 'vuescroll';

@Component({
  components: { VisualizationItem }
})
export default class VisualizationItemListing extends Vue {
  @Ref()
  readonly viewAllScroll!: vuescroll;
  private isShowSelectVizTypePanel = false;
  @PropSync('itemSelected', { required: true })
  private itemSelectedSync!: VisualizationItemData;
  @Prop({ type: Array, required: true })
  private items!: VisualizationItemData[];

  @Watch('itemSelected', { immediate: true })
  handleOnItemSelectedChanged(itemSelected: VisualizationItemData) {
    this.$nextTick(() => {
      const idItemSelected = document.getElementById(itemSelected.type);
      idItemSelected?.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth'
      });
    });
  }

  mounted() {
    setTimeout(() => {
      this.handleOnItemSelectedChanged(this.itemSelectedSync);
    }, 350);
  }

  handleShowSelectedVizItem() {
    this.isShowSelectVizTypePanel = !this.isShowSelectVizTypePanel;
  }

  private handleSelectItem(icon: VisualizationItemData) {
    this.isShowSelectVizTypePanel = false;
    this.itemSelectedSync = icon;
  }

  private isSelected(item: VisualizationItemData): boolean {
    return this.itemSelectedSync?.type === item.type;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.ml5 {
  margin-left: 5px;
}

.select-type-chart-container {
  display: flex;
  width: 100%;
  align-items: center;
  flex-wrap: wrap;

  .title-panel {
    height: 21px;
    margin-bottom: 16px;
  }

  .title {
    @include medium-text();
    font-weight: var(--builder-font-weight);
    justify-content: flex-start;
    padding-right: 5px;
  }

  .selected-item-container {
    margin-right: 5px;
    justify-content: flex-start;
  }

  .menu-select-scroll-container {
    width: 100%;
    background-color: var(--chart-icon-listing-bg);
    padding: 12px;

    .menu-select-scroll-item:not(:last-child) {
      margin-right: 16px;
    }
  }

  .btn-see-more {
    padding: 5px 10px;
    display: flex;
    margin-left: 10px;
    align-items: center;
    justify-content: space-between;
    border-radius: 4px;
    color: var(--text-color);
    font-size: 14px;
    letter-spacing: 0.2px;
    margin-bottom: 4px;

    .btn-title {
      letter-spacing: 0.6px;
    }

    img {
      margin-left: 6px;
    }
  }
}

.popover-custom {
  background: none;
  max-width: unset;
  border: none;

  ::v-deep {
    .arrow {
      display: none;
    }
  }

  .dropdown-viz-items-popover-container {
    width: 600px;
    height: 450px;
    padding: 4px;

    background-color: var(--secondary--root);
    border: var(--menu-border);
    box-shadow: var(--menu-shadow);
    border-radius: 4px;

    .dropdown-viz-items-scroll-container {
      justify-content: center;
      display: flex;
      flex-wrap: wrap;
      padding-bottom: 20px;
      height: auto;

      .dropdown-viz-item {
        ::v-deep {
          .visualization-item {
            background-color: var(--chart-icon-bg);
            border-radius: 4px;
            width: 118px;
            height: 126px;
            margin: 10px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            img {
              width: 48px;
              height: 48px;
            }

            .title {
              font-weight: 500;
              font-stretch: normal;
              font-style: normal;
              line-height: normal;
              letter-spacing: 0.23px;
              text-align: center;
              font-size: 14px;
              color: var(--secondary-text-color--root);
            }
          }
        }
      }
    }
  }
}
</style>
