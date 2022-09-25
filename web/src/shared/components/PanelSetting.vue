<template>
  <div class="panel" :class="classChartPreview" @click.stop="handleCollapsePanel">
    <div class="setting-panel d-flex flex-row align-items-start">
      <div class="setting-title cursor-default">{{ title }}</div>
      <div class="d-flex flex-row ml-auto">
        <img class="setting-icon btn-ghost mr-2" src="@/assets/icon/ic_setting.svg" @click.stop="toggleSetting" v-if="isShowSettingIcon && isOpened" />
        <div class="d-flex flex-row setting-icon btn-ghost align-items-center" @click.stop="toggleCollapse">
          <FadeTransition group>
            <b-icon-chevron-double-up :key="'up'" v-if="isOpened"></b-icon-chevron-double-up>
            <b-icon-chevron-double-down :key="'down'" v-else></b-icon-chevron-double-down>
          </FadeTransition>
        </div>
      </div>
    </div>
    <CollapseTransition>
      <div v-if="isOpened" class="mar-t-15">
        <slot name="default"></slot>
        <CollapseTransition>
          <div class="setting-panel-area" :class="classChartPreview" v-show="isSettingOpened && isShowSettingIcon">
            <slot name="setting"></slot>
          </div>
        </CollapseTransition>
      </div>
    </CollapseTransition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';

@Component({
  components: {
    CollapseTransition,
    FadeTransition
  }
})
export default class PanelSetting extends Vue {
  @Prop({ type: String, default: '' })
  title!: string;

  @Prop({ type: Boolean, default: false })
  isSettingOpened!: boolean;

  @Prop({ type: Boolean, default: true })
  isShowSettingIcon!: boolean;

  @Prop({ type: Boolean, default: false })
  isCollapsed!: boolean;

  private get isOpened() {
    return !this.isCollapsed;
  }

  private get classChartPreview() {
    return {
      'no-bottom-border': this.isSettingOpened,
      'cursor-pointer': this.isCollapsed
    };
  }

  private toggleCollapse() {
    this.$emit('toggleCollapse');
  }

  private toggleSetting() {
    this.$emit('toggleSetting');
  }

  private handleCollapsePanel() {
    if (this.isCollapsed) {
      this.toggleCollapse();
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';

.panel {
  background-color: darken(#333645, 1);
  height: 100%;
  padding: 15px;
}

.setting-panel {
  .setting-title {
    @include semi-bold-text();
    font-size: 14px;
  }

  .setting-icon {
    padding: 5px;
    width: 16px;
    height: 16px;
    box-sizing: content-box;
    margin-top: -4px;
  }
}

.scroll-bar {
  height: calc(100% - 48px) !important;
}

.setting-panel-area {
  ::v-deep {
    .select-container > .relative > span > button {
      background-color: var(--primary);
      height: 35px;
    }

    .select-container > .relative > span > button > div > span {
      @include regular-text();
      font-size: 12px;
      letter-spacing: 0.2px;
      text-align: left;
      margin-bottom: 10px;
    }

    .form-control {
      background-color: var(--primary) !important;
    }

    .ic-16 {
      margin-right: 0;
    }

    input {
      padding: 0px 2px 0px 10px !important;
    }
  }
}
</style>
