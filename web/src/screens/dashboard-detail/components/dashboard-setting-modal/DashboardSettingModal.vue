<template>
  <div v-if="canShowModal">
    <DiCustomModal
      id="dashboard-setting"
      ref="modal"
      size="md"
      title="Dashboard Setting"
      :no-close-on-backdrop="isLoading"
      :no-close-on-esc="isLoading"
      hide-header-close
      @onCancel="cancelSetting"
      @onClickOk="applySetting"
    >
      <template #default>
        <div class="dashboard-setting">
          <div class="reset-panel">
            <div class="header">
              <h5>Select Theme</h5>
              <div @click="selectTheme(DashboardThemeType.LightDefault)">Reset to default</div>
            </div>
            <div class="theme-selection">
              <template v-for="theme in LightThemes">
                <div :title="theme.label" :key="theme.type" :class="{ active: theme.type === currentTheme }" @click="selectTheme(theme.type)">
                  <img :alt="theme.type" :src="require(`@/assets/icon/dashboard/theme/${theme.type}.png`)" />
                  <div>{{ theme.label }}</div>
                </div>
              </template>
            </div>
            <div class="theme-selection">
              <template v-for="theme in DarkThemes">
                <div :title="theme.label" :key="theme.type" :class="{ active: theme.type === currentTheme }" @click="selectTheme(theme.type)">
                  <img :alt="theme.type" :src="require(`@/assets/icon/dashboard/theme/${theme.type}.png`)" />
                  <div>{{ theme.label }}</div>
                </div>
              </template>
            </div>
          </div>
          <ToggleSettingComponent :settingItem="overlapSettingItem" class="overlap" @onChanged="onOverlapSettingChanged" />
        </div>
      </template>
      <template #modal-footer="{ok, cancel}">
        <DiButton border title="Cancel" :disabled="isLoading" @click="cancel"></DiButton>
        <DiButton primary title="Apply" :isLoading="isLoading" :disabled="isLoading" @click="ok"></DiButton>
      </template>
    </DiCustomModal>
  </div>
</template>

<script lang="ts" src="./DashboardSettingModal.ts" />

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';

#dashboard-setting {
  .modal-title {
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: 0.2px;
    font-weight: bold;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .di-button {
      flex: 1;
      height: 42px;
    }
    //
    .di-button + .di-button {
      margin-left: 16px;
    }
  }

  .dashboard-setting {
    > .reset-panel {
      margin-bottom: 24px;
      > .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;

        > h5 {
          font-size: 16px;
          letter-spacing: 0.13px;
          line-height: 1.75;
          cursor: default;
          color: var(--secondary-text-color);
        }

        > div {
          color: $accentColor;
          cursor: pointer;
        }
      }

      > .theme-selection {
        cursor: pointer;

        display: flex;
        justify-content: space-between;
        overflow: Header hidden;

        padding: 2px;

        & + .theme-selection {
          margin-top: 24px;
        }

        > .active {
          img {
            border: solid 2px var(--accent);
          }

          div {
            color: var(--accent);
          }
        }

        > div {
          > img {
            height: 86px;
            margin-bottom: 6px;
            width: 80px;
          }

          > div {
            white-space: nowrap;
            overflow: hidden;
            width: 80px;
            text-overflow: ellipsis;
            color: var(--secondary-text-color);
            font-size: 14px;
          }
        }
      }
    }

    > .overlap {
      justify-content: space-between;
      padding: 0;

      p.label {
        opacity: initial;
        color: var(--secondary-text-color);
      }

      [class*='col-'] {
        flex: unset;
        max-width: unset;
        width: unset;
        padding: 0;
      }
    }
  }
}
</style>
