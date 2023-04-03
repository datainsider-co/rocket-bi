<template>
  <LayoutWrapper class="cdp">
    <router-view></router-view>
    <DiShareModal ref="shareModal" />
  </LayoutWrapper>
</template>
<script lang="ts">
import { LoggedInScreen } from '@/shared/components/vue-hook/LoggedInScreen';
import { Component, Provide, Ref } from 'vue-property-decorator';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import { LayoutWrapper, LayoutSidebar } from '@/shared/components/layout-wrapper';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { Routers } from '@/shared';

@Component({
  components: {
    LayoutWrapper
  }
})
export default class CDP extends LoggedInScreen {
  @Ref()
  private readonly shareModal!: DiShareModal;

  @Provide('showShareModal')
  showShareModal(resource: ResourceData): void {
    // todo: show share modal
  }
}
</script>
<style lang="scss">
.cdp {
  display: flex;
  flex-direction: column;
  height: 100vh;
  text-align: left;

  &-body {
    display: flex;
    flex: 1;
    padding: 24px 32px 24px 16px;

    > * {
      overflow: hidden;
    }

    .navigation-panel {
      width: auto;
      max-width: 210px;

      .di-btn-shadow {
        margin-right: auto;
        margin-bottom: 16px;

        [class^='di-icon-'] + .title {
          margin-left: 10px;
        }
        @media screen and (max-width: 800px) {
          width: fit-content;
          .title {
            display: none;
          }
          i {
            margin: 0;
          }
        }
      }
    }

    &-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      text-align: left;

      &-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 24px;
        position: relative;

        &-icon {
          margin-right: 16px;
          text-decoration: none;
          color: var(--text-color);
        }

        &-title {
          display: flex;
          flex: 1;
          align-items: center;
          font-size: 24px;
          font-weight: 600;
          color: var(--text-color);

          span {
            line-height: 1.4;
          }
        }

        &::after {
          content: '';
          display: flex;
          position: absolute;
          bottom: 16px;
          left: 0;
          width: 100%;
          height: 0.5px;
          opacity: 0.3;
          z-index: 1;
          border: solid 0.5px #d6d6d6;
        }

        &-actions {
          display: flex;
          .di-button + .di-button {
            margin-left: 8px;
          }
          .di-button {
            min-width: 72px;
          }
        }

        &.cdp-body-content-header-non-hr {
          padding-bottom: 20px;

          &::after {
            display: none;
          }

          .cdp-body-content-header-title {
            font-weight: 500;
          }
        }
      }

      &-body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      &-block {
        display: flex;
        flex-direction: column;
        border-radius: 4px;
        background-color: var(--panel-background-color);
        //overflow: hidden;
        padding: 16px;
        margin-bottom: 16px;

        &-title {
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: bold;
          line-height: 1;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          color: var(--text-color);
          text-decoration: none;

          .di-button {
            height: 34px;
            padding: 0 12px;
            background-color: #fafafb;

            .title {
              font-weight: normal !important;
              padding: 0;
            }

            [class^='di-icon-'] + .title {
              font-weight: normal !important;
              padding: 0;
              margin-left: 8px;
            }
          }

          .btn-group {
            .di-button + .di-button {
              border-left: 1px solid var(--directory-grid-line-color);
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }
          }

          &:hover {
            text-decoration: none;
          }
        }

        &-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        &-nodata {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          &-icon {
            font-size: 60px;
            margin-bottom: 16px;
            color: var(--charcoal);
          }

          &-msg {
            font-size: 16px;
          }
        }
      }
    }
  }

  .bg-lighter {
    background-color: #fafafb;
  }

  .btn-cdp {
    background-color: #fafafb !important;
    min-width: 85px;
    img {
      margin-right: 8px;
    }
  }
  .input-group-text {
    background-color: var(--input-background-color);
  }

  .form-control {
    padding: 0.375rem 16px;
    min-height: 40px;
    height: auto;
  }

  .input-group .input-group-prepend + .form-control {
    padding-left: 0;
  }

  .btn-di {
    height: 42px;
    min-width: 170px;
  }
}
</style>
