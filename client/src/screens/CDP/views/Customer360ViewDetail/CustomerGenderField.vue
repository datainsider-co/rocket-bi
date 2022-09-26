<template>
  <div class="customer-string-field">
    <label>{{ label }}</label>
    <span :class="{ 'no-data': isNullGender }">{{ isNullGender ? '---' : formatGender(data) }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StringUtils } from '@/utils/string.utils';
import { DateTimeFormatter } from '@/utils';
import { UserGenders } from '@core/domain';
import { isNull } from 'lodash';

@Component
export default class CustomerGenderField extends Vue {
  private readonly allGender = UserGenders.allGenders();

  @Prop({ required: true })
  private readonly data!: number | null;

  @Prop({ required: false, default: 'Gender' })
  private readonly label!: string;

  private get isNullGender() {
    //female = 0
    // eslint-disable-next-line no-undef
    return isNull(this.data);
  }

  formatGender(gender: number): string {
    return UserGenders.toDisplayName(gender as number);
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
