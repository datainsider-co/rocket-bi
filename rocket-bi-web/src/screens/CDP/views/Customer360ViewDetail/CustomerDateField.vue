<template>
  <div class="customer-string-field">
    <label>{{ label }}</label>
    <span :class="{ 'no-data': !data }">{{ data ? formatDate(data) : '---' }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StringUtils } from '@/utils/string.utils';
import { DateTimeFormatter } from '@/utils';

@Component
export default class CustomerDateField extends Vue {
  @Prop({ required: true })
  private readonly data!: number | null;

  @Prop({ required: false, default: 'Date of birth' })
  private readonly label!: string;

  formatDate(date: number): string {
    return DateTimeFormatter.formatASMMMDDYYYY(date);
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
