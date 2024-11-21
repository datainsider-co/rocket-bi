<template>
  <div class="dashboard-theme-setting">
    <label class="dashboard-theme-setting--title"><strong>Dashboard Theme</strong></label>
    <span class="dashboard-theme-setting--subtitle">Please choose a theme. </span>
    <div class="dashboard-theme-setting--theme-selection">
      <template v-for="theme in LightThemes">
        <div :title="theme.label" :key="theme.type" :class="{ active: theme.type === value.themeName }" @click="selectTheme(theme.type)">
          <img :alt="theme.type" :src="require(`@/assets/icon/dashboard/theme/${theme.type}.png`)" />
          <div>{{ theme.label }}</div>
        </div>
      </template>
    </div>
    <div class="dashboard-theme-setting--theme-selection">
      <template v-for="theme in DarkThemes">
        <div :title="theme.label" :key="theme.type" :class="{ active: theme.type === value.themeName }" @click="selectTheme(theme.type)">
          <img :alt="theme.type" :src="require(`@/assets/icon/dashboard/theme/${theme.type}.png`)" />
          <div>{{ theme.label }}</div>
        </div>
      </template>
    </div>
    <DiToggle class="dashboard-theme-setting--overlap-mode" :value.sync="value.enableOverlap" label="Overlap mode"></DiToggle>
  </div>
</template>

<script lang="ts">
import { AbstractSettingComponent } from '@/screens/dashboard-detail/components/dashboard-setting-modal/AbstractSettingComponent';
import Component from 'vue-class-component';
import { LabelNode } from '@/shared';
import { DashboardThemeType } from '@core/common/domain';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { ObjectUtils } from '@core/utils';

@Component
export default class DashboardThemeSetting extends AbstractSettingComponent {
  private DarkThemes: LabelNode[] = [
    {
      label: 'Dark Default',
      type: DashboardThemeType.Default
    },
    {
      label: 'Clear Sky',
      type: DashboardThemeType.Theme1
    },
    {
      label: 'Deep Sea Space',
      type: DashboardThemeType.Theme2
    },
    {
      label: 'Lawrencium',
      type: DashboardThemeType.Theme3
    },
    {
      label: 'Dark',
      type: DashboardThemeType.Theme4
    }
  ];
  private LightThemes: LabelNode[] = [
    {
      label: 'Dodger Blue',
      type: DashboardThemeType.LightDefault
    },
    {
      label: 'Anzac',
      type: DashboardThemeType.LightTheme1
    },
    {
      label: 'Electric Violet',
      type: DashboardThemeType.LightTheme2
    },
    {
      label: 'Curious Blue',
      type: DashboardThemeType.LightTheme3
    },
    {
      label: 'Ebony Clay',
      type: DashboardThemeType.LightTheme4
    }
  ];

  protected selectTheme(themeName: DashboardThemeType): void {
    this.value.themeName = themeName;
    const theme = _ThemeStore.getTheme(themeName);
    Object.entries(theme.defaultSettings).forEach(([key, value]) => {
      // assign default value to value by key. if key contains dot, it will be assigned to nested object
      ObjectUtils.set(this.value, key, value);
    });
  }

  ensureSetting(): void {
    //
  }
}
</script>

<style lang="scss">
.dashboard-theme-setting {
  &--title {
    font-size: 16px;
    display: block;
    margin: 0 0 8px;
    font-style: normal;
    line-height: 132%;
  }

  &--subtitle {
    display: block;
    font-size: 14px;
    color: #8e8e93;
    margin-bottom: 16px;
    font-style: normal;
    line-height: 132%;
  }

  &--theme-selection {
    //cursor: pointer;

    display: flex;
    justify-content: space-around;
    overflow: hidden;

    padding: 2px;
    margin-bottom: 8px;

    & + .theme-selection {
      margin-top: 24px;
    }

    > .active {
      img {
        box-shadow: 0 0 0 2px var(--accent);
      }

      div {
        color: var(--accent);
      }
    }

    > div {
      cursor: pointer;
      width: 80px;

      > img {
        height: 86px;
        margin-bottom: 6px;
        border-radius: 2px;
      }

      > div {
        white-space: nowrap;
        color: var(--text-color);
        font-size: 14px;
        text-align: center;
      }

      &:hover {
        > img {
          box-shadow: 0 0 0 2px var(--accent);
        }

        > div {
          color: var(--accent);
        }
      }
    }
  }
}
</style>
