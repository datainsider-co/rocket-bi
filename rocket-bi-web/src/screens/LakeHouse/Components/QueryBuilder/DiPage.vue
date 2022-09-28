<template>
  <div class="di-page">
    <HeaderBar></HeaderBar>
    <header>
      <slot name="header">
        <div class="di-page--default-header" v-if="iconClass && title">
          <i :class="iconClass" class="icon"></i>
          <span class="title">{{ title }}</span>
        </div>
      </slot>
    </header>
    <div class="di-page--body">
      <slot>
        <router-view></router-view>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DiPage extends Vue {
  @Prop({ required: false, type: String, default: '' })
  private readonly iconClass!: string;
  @Prop({ required: false, type: String, default: '' })
  private readonly title!: string;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

.di-page {
  display: flex;
  flex-direction: column;
  // trick prevent scroll
  height: calc(100vh - 12px);
  width: 100vw;

  > header > .di-page--default-header {
    flex: 1;
    padding: 24px 24px 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    .icon {
      font-size: 24px;
      margin-right: 16px;
      line-height: 1;
    }
    .title {
      @include medium-text(24px);
    }
  }

  > .di-page--body {
    flex: 1;
    overflow: hidden;
  }
}
</style>
