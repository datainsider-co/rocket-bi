<template>
  <div class="d-flex justify-content-center align-items-center rounded empty-component">
    <div>
      <slot class="image">
        <img alt="empty dashboard" src="@/assets/icon/directory-empty.svg" />
      </slot>
      <div class="text-info">
        <slot name="text">
          {{ title }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class EmptyComponent extends Vue {
  @Prop({ required: false, type: String, default: '' })
  private readonly title!: string;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.empty-component {
  background-color: var(--secondary);

  > div {
    > img {
      width: 40px;
      height: 40px;
    }
    & > i {
      font-size: 40px;
      color: var(--icon-color);
      opacity: 0.8;
    }
  }

  .text-info {
    margin-top: 16px;
    color: var(--secondary-text-color) !important;
    font-size: 16px;
    font-stretch: normal;
    font-style: normal;
    font-weight: normal;
    letter-spacing: 0.27px;
    line-height: 1.5;
    text-align: center;
  }
}
</style>
