<template>
  <div class="toggle-container custom-switch" @click.prevent="toggleValue">
    <input :id="`toggle-${id}`" v-model="syncValue" class="custom-control-input" type="checkbox" />
    <label :for="`toggle-${id}`" class="custom-control-label"> </label>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync, Watch } from 'vue-property-decorator';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({ components: {} })
export default class DiToggle extends Vue {
  @PropSync('value', { default: false })
  private syncValue!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  private toggleValue() {
    if (!this.disable) {
      this.syncValue = !this.syncValue;
      this.$emit('onSelected', this.syncValue);
    }
  }

  @Watch('syncValue')
  onValueChange(newValue: boolean) {
    TrackingUtils.track(`toggle-${this.id}`, { value: newValue });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.toggle-container {
  .custom-control-label::after {
    cursor: pointer;
    top: 0.3rem;
    left: -2.4rem;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 0.35rem;
  }

  .custom-control-input:checked ~ .custom-control-label::after {
    background-size: cover;
    background-color: var(--primary);
    cursor: pointer;
  }

  .custom-control-label {
    font-weight: bold;
    padding-left: 4px;
    letter-spacing: 0.27px;
    cursor: pointer;
  }
}
</style>
