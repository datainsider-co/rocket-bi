<template>
  <div class="d-inline-block h-100 w-100">
    <div v-if="hintChart" class="d-flex flex-column hint-area text-left">
      <slot name="error"></slot>
      <div class="d-inline-flex align-items-start text-left">
        <img alt="idea" class="icon-idea" src="@/assets/icon/idea.svg" />
        <div class="text-area">
          <div>How to create a {{ hintChart.name }}?</div>
          <div class="hint-text">
            <div v-for="(hintText, index) in hintChart.pages[0].hintTexts" :key="index">
              {{ hintText }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="hintImg" class="hint-image">
        <img :key="hintChart.name" :src="hintImg" alt="hint-icon" class="unselectable" />
      </div>
    </div>
    <div v-else class="d-flex flex-column default-hint align-items-center h-100 justify-content-center">
      <slot name="error"></slot>
      <img :key="itemSelected.src" :src="require(`@/assets/icon/charts/${itemSelected.src}`)" alt="icon" class="chart-icon unselectable" />
      <div class="hint-description">
        <img alt="help" class="btn-ghost help-icon" src="@/assets/icon/ic_help.svg" />
        <span> Learn to create {{ itemSelected.title }} Chart <strong class="btn-ghost">here</strong>. </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { VisualizationItemData } from '@/shared';
import { HintChartData, HintCharts } from '@/shared/constants/HintChartData';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ListUtils } from '@/utils';

@Component
export default class HintPanel extends Vue {
  @Prop({ required: true })
  private itemSelected!: VisualizationItemData;

  private get hintChart(): HintChartData | undefined {
    return HintCharts[this.itemSelected.type];
    // return void 0
  }

  private get hintImg(): any | null {
    const pages = this.hintChart?.pages ?? [];
    const imgSrc = _ThemeStore.isDarkTheme ? ListUtils.getHead(pages)?.darkHint : ListUtils.getHead(pages)?.lightHint;
    if (imgSrc) {
      return require(`@/assets/icon/${imgSrc}`);
    } else {
      return null;
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import 'node_modules/bootstrap/scss/bootstrap-grid';

.hint-area {
  height: 100%;
  padding: 8px 0;
  position: relative;
  width: 100%;

  img[class~='icon-idea'] {
    height: 16px;
    width: 16px;
  }

  .text-area {
    margin-left: 8px;
    @include semi-bold-14();
    font-weight: var(--builder-font-weight);

    > .hint-text {
      margin-top: 16px;
      @include regular-text-14();
      color: var(--secondary-text-color);
    }
  }

  .hint-image {
    align-items: center;
    bottom: 0;
    display: flex;
    justify-content: center;

    left: 0;
    position: absolute;
    right: 0;
    top: 0;

    > img {
      width: -webkit-fill-available;
      width: -moz-available;
    }
  }
}

.dark .hint-text {
  opacity: 0.4;
}

.default-hint {
  height: 100%;
  width: 100%;

  > img.chart-icon {
    @include icon-128();
  }

  .hint-description {
    font-size: 16px;
    @include regular-text();
    letter-spacing: 0.27px;
    line-height: 1.5;
    margin-top: 16px;

    > img.help-icon {
      box-sizing: content-box;
      padding: 4px;
    }

    strong {
      text-decoration: underline;
    }
  }
}
</style>
