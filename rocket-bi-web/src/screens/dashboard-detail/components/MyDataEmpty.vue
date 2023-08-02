<template>
  <div class="d-flex justify-content-center align-items-center rounded mydata-empty">
    <div class="d-flex flex-column justify-content-center align-items-center">
      <img class="mb-3" alt="empty data" width="200" height="140" src="@/assets/icon/empty_data.svg" />
      <div class="text-info">
        Your dashboard listing is empty <br />
        Click new to create directory
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class MyDataEmpty extends Vue {
  @Prop({ type: Boolean, default: true, required: false })
  private readonly isHideCreateHint!: boolean;
  @Prop({ type: String, default: 'Your directory listing is empty', required: false })
  private readonly title!: string;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.mydata-empty {
  background-color: var(--secondary);

  .text-info {
    color: var(--secondary-text-color) !important;
    font-family: Barlow;
    font-size: 14px;
    font-stretch: normal;
    font-style: normal;
    font-weight: 400;
    letter-spacing: 0.27px;
    line-height: normal;
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
