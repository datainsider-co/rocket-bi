<template>
  <div class="notification error mt-3">
    <img src="@/assets/icon/ic_error.svg" alt="error" />
    <div class="info">
      <div class="title unselectable">{{ title }}</div>
      <div v-if="message" class="message">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({})
export default class ErrorMessage extends Vue {
  @Prop({ required: false, default: '' })
  private readonly title!: string;

  @Prop({ required: false, default: '' })
  private readonly message!: string;
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.notification {
  @include regular-text();
  display: flex;
  flex-direction: row;
  padding: 15px;
  border-radius: 8px;
  align-items: center;

  img {
    margin-right: 12px;
    height: 24px;
    width: 24px;
  }

  .info {
    display: flex;
    flex-direction: column;
  }

  &.success {
    background-color: #effff9;
    border: 1px solid #14c684;

    .title {
      font-size: 15px;
      font-weight: 400;
      line-height: 100%;
    }
  }

  &.error {
    background-color: #fff6f6;
    border: 1px solid #ff5151;
    align-items: start;

    .title {
      font-size: 15px;
      font-weight: 500;
      line-height: 100%;
      margin-bottom: 4px;
    }
  }
}
</style>
