<template>
  <div class="navigation-panel">
    <div class="navigation-panel--nav">
      <slot name="top"></slot>
      <template v-for="(item, index) in items">
        <router-link :key="index" :to="item.to">
          <template #default="{ href, navigate, isActive }">
            <div
              :id="item.id"
              :class="{ active: isActive, disabled: item.disabled }"
              class="navigation-panel--nav-item"
              :title="item.displayName"
              @click="navigate"
            >
              <i :class="item.icon"></i>
              <span>{{ item.displayName }}</span>
            </div>
          </template>
        </router-link>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

export interface NavigationItem {
  id?: string;
  displayName: string;
  to: any;
  icon: string;
  navigateClass?: string | any;
  disabled?: boolean;
}

@Component
export default class NavigationPanel extends Vue {
  @Prop({ required: true, type: Array, default: [] })
  private readonly items!: NavigationItem[];
}
</script>

<style lang="scss">
.navigation-panel {
  border-radius: 4px;
  height: 100%;
  margin-right: 16px;
  width: 210px;
  //width: 23%;

  &--nav {
    display: flex;
    flex-direction: column;
    text-align: left;

    .popover-container + .navigation-panel--nav-item,
    .di-btn-shadow + .navigation-panel--nav-item {
      margin-top: 16px;
    }

    &-item {
      height: 33px;
      align-items: center;
      border-radius: 8px;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: flex;
      padding: 8px 16px;
      text-decoration: none;

      &.disabled {
        cursor: not-allowed !important;
        opacity: var(--normal-opacity);
        pointer-events: none;
      }

      & + & {
        margin-top: 8px;
      }

      > i {
        font-size: 16px;
        margin-right: 8px;
      }

      > span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
        font-stretch: normal;
        font-style: normal;
        letter-spacing: 0.6px;
        line-height: normal;
        text-align: justify;
      }

      &.active {
        background-color: var(--accent) !important;
        color: var(--accent-text-color);
        font-weight: 500;
      }

      &:hover {
        background: var(--active-color);
      }
    }
  }

  @media screen and (max-width: 800px) {
    width: unset;
    &--nav-item {
      width: 43.61px;
      padding: 8px;
      justify-content: center;

      > i {
        margin-right: 0;
      }

      > span {
        display: none;
      }
    }
  }
}
</style>
