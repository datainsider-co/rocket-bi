<template>
  <div class="d-flex flex-column">
    <div class="panel-header-divider"></div>
    <div
      class="d-flex align-items-center cursor-pointer unselectable"
      style="padding: 12px 0 12px 0;"
      :aria-controls="targetId"
      :aria-expanded="isExpand"
      @click="handleCollapse"
    >
      <img class="mr-2" style="height: 16px; width: 16px;" :src="require(`@/assets/icon/${iconCollapse}`)" alt="icon" />
      <h6 class="header text-uppercase">{{ header }}</h6>
    </div>
    <b-collapse :id="targetId" v-model="isExpand">
      <slot></slot>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class PanelHeader extends Vue {
  @Prop({ type: String, required: true })
  header!: string;

  @Prop({ type: String, required: true })
  targetId!: string;

  private isExpand = false;

  collapse() {
    this.isExpand = false;
  }

  expand() {
    this.isExpand = true;
  }
  private handleCollapse() {
    this.isExpand = !this.isExpand;
  }

  private get iconCollapse(): string {
    return this.isExpand ? 'ic-16-arrow-down.svg' : 'ic-16-arrow-up.svg';
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.header {
  @include medium-text();
  margin-bottom: 0;
  cursor: pointer;
  font-weight: 500;
}

.panel-header-divider {
  height: 1px;
}

.light .panel-header-divider {
  opacity: 0.1;
  background-color: var(--secondary-text-color);
}

.dark .panel-header-divider {
  background-color: #00000033;
}
</style>
