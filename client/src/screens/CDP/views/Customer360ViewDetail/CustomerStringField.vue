<template>
  <div class="customer-string-field">
    <label>{{ label }}</label>
    <span :class="{ 'no-data': isEmpty(data) }">{{ isEmpty(data) ? '---' : data }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StringUtils } from '@/utils/string.utils';

@Component
export default class CustomerStringField extends Vue {
  @Prop({ required: true })
  private readonly data!: string | null;

  @Prop({ required: true })
  private readonly label!: string;

  isEmpty(text: string) {
    return StringUtils.isEmpty(text);
  }
}
</script>

<style lang="scss">
.customer-string-field {
  display: flex;
  flex-direction: column;
  //padding-top: 24px;
  padding: 0 12px;

  & > label {
    font-size: 12px;
    margin-bottom: 12px;
    color: var(--secondary-text-color);
  }

  & > span:not(.no-data) {
    font-weight: 500;
  }

  & > span.no-data {
    color: var(--neutral);
  }
}
</style>
