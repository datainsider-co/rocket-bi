<template>
  <div class="d-flex justify-content-center align-items-center rounded empty-directory">
    <div class="d-flex flex-column justify-content-center align-items-center">
      <img alt="empty dashboard" class="ic-40" src="@/assets/icon/directory-empty.svg" style="margin-bottom: 15px" />
      <div class="text-info">
        {{ title }} <br />
        <template v-if="!isHideCreateHint">
          Click new to create directory
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class EmptyDirectory extends Vue {
  @Prop({ type: Boolean, default: true, required: false })
  private readonly isHideCreateHint!: boolean;
  @Prop({ type: String, default: 'Your directory is empty', required: false })
  private readonly title!: string;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.empty-directory {
  background-color: var(--secondary);

  .text-info {
    color: var(--secondary-text-color) !important;
    font-family: Barlow;
    font-size: 16px;
    font-stretch: normal;
    font-style: normal;
    font-weight: normal;
    letter-spacing: 0.27px;
    line-height: 1.5;
    text-align: center;
  }

  //b {
  //  @include bold-text;
  //  color: var(--accent);
  //  text-decoration: underline;
  //  cursor: pointer;
  //}
}
</style>
