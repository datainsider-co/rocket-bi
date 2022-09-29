<template>
  <div class="setting-container no-gutters" :class="{ 'disabled-setting': disable }">
    <div v-if="label != null" class="label single-line mb-2">{{ label }}</div>
    <div class="d-flex align-items-center justify-content-between align-container" style="height: 34px;">
      <b-icon-text-left :class="`${iconClass(`left`)}`" @click="selectAlign(`left`)" />
      <b-icon-text-center :class="`${iconClass(`center`)}`" @click="selectAlign(`center`)" />
      <b-icon-text-right :class="`${iconClass(`right`)}`" @click="selectAlign(`right`)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Log } from '@core/utils';

@Component({})
export default class AlignSetting extends Vue {
  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: true })
  private readonly value!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  private selectValue = this.value;

  @Watch('value')
  handleValueChange(newValue: string) {
    this.selectValue = newValue;
  }

  private selectAlign(newAlign: string): void {
    if (newAlign != this.selectValue) {
      this.selectValue = newAlign;
      this.$emit('onChanged', this.selectValue);
    }
  }

  private iconClass(align: string) {
    const classString = 'btn-icon btn-ghost di-popup ic-16';
    return this.selectValue == align ? `${classString} active` : `${classString}`;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.align-container {
  height: 34px;

  > .btn-icon {
    padding: 8px;
    font-size: 20px;
    &:first-child {
      padding-left: 0;
    }
    &:last-child {
      padding-right: 0;
    }
  }

  .active {
    color: var(--accent) !important;
  }
}

.align-item {
  @include ic-16;
}
</style>
