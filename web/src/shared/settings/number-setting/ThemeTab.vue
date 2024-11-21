<template>
  <PanelHeader header="Theme" target-id="theme-tab" id="theme-tab">
    <div class="theme-container">
      <img
        v-for="(theme, index) in themes"
        :key="index"
        class="theme-item"
        :class="theme.className"
        :src="require(`@/assets/icon/charts/kpi_theme/${theme.displayName}.jpg`)"
        @click="handleThemeChanged(theme.id)"
      />
    </div>
  </PanelHeader>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { KPITheme, NumberOptionData } from '@core/common/domain';
import { get, set } from 'lodash';
import { Log } from '@core/utils';

@Component({
  components: { DiDropdown, PanelHeader }
})
export default class ThemeTab extends Vue {
  private readonly themeSettings = require('./themeSettings.json');
  @Prop()
  private readonly setting?: NumberOptionData;

  private readonly themes: any[] = [
    {
      id: KPITheme.Style1,
      displayName: 'theme_1'
    },
    {
      id: KPITheme.Style2,
      displayName: 'theme_2'
    },
    {
      id: KPITheme.Style3,
      displayName: 'theme_3'
    },
    {
      id: KPITheme.Style4,
      displayName: 'theme_4'
    },
    {
      id: KPITheme.Style5,
      displayName: 'theme_5'
    },
    {
      id: KPITheme.StyleArea1,
      displayName: 'style_area_1'
    }

    // {
    //   id: KPITheme.Style6,
    //   displayName: 'theme_6'
    // }
    // {
    //   id: KPITheme.Style7,
    //   displayName: 'theme_7'
    // },
    // {
    //   id: KPITheme.Style3,
    //   displayName: 'theme_3'
    // },
    // {
    //   id: KPITheme.Style9,
    //   displayName: 'theme_9',
    //   className: 'grid-1'
    // },
    // {
    //   id: KPITheme.Style10,
    //   displayName: 'theme_10',
    //   className: 'grid-1'
    // },
    // {
    //   id: KPITheme.Style11,
    //   displayName: 'theme_11',
    //   className: 'grid-1'
    // },
    // {
    //   id: KPITheme.Style12,
    //   displayName: 'theme_12',
    //   className: 'grid-1'
    // }
  ];

  private get theme(): string {
    return this.setting?.theme ?? '';
  }

  private handleThemeChanged(theme: string) {
    const themeSetting: Record<string, any> = this.getThemeSetting(theme);
    const settingAsMap: Map<string, any> = new Map();
    for (const key in themeSetting) {
      const setting = themeSetting[key];
      if (key === 'title') {
        set(setting, 'text', this.setting?.title?.text);
      }
      if (key === 'subtitle') {
        set(setting, 'text', this.setting?.subtitle?.text);
      }

      if (key === 'prefix') {
        set(setting, 'text', this.setting?.prefix?.text);
      }

      if (key === 'postfix') {
        set(setting, 'text', this.setting?.postfix?.text);
      }

      if (key === 'icon') {
        set(setting, 'iconClass', this.setting?.icon?.iconClass);
      }
      if (key === 'trendLine') {
        set(setting, 'enabled', this.setting?.trendLine?.enabled);
        set(setting, 'trendBy', this.setting?.trendLine?.trendBy);
        set(setting, 'displayAs', this.setting?.trendLine?.displayAs);
      }
      settingAsMap.set(key, themeSetting[key]);
    }
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private getThemeSetting(theme: string) {
    return get(this.themeSettings, `${theme}`, {});
  }
}
</script>

<style lang="scss">
#theme-tab {
  .theme-container {
    display: grid;
    gap: 8px;
    grid-template-columns: auto auto auto auto auto auto;
    justify-content: center;

    .theme-item {
      grid-column: span 2;
      width: 100%;
      max-height: 105px;
      cursor: pointer;

      &:hover {
        border: 1px solid var(--accent);
        border-radius: 8px;
        transform: scale(1.1);
        overflow: hidden;
        transition: transform 0.2s ease-in-out;
      }

      &.grid-1 {
        grid-column: span 1;
        max-width: 90px;
      }
    }
  }

  &.show {
    margin-bottom: 16px;
  }
}
</style>
