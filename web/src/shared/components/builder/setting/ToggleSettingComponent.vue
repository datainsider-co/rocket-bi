<template>
  <div :id="genBtnId(`${settingItem.name}`)" class="setting-container toggle-setting">
    <p class="col-3 label text-break">{{ settingItem.name }}</p>
    <div class="col-9 custom-control custom-switch" style="padding-left: 40px" @click.prevent="toggleButton">
      <input :id="`toggle-${id}`" v-model="value" class="custom-control-input" type="checkbox" />
      <label :for="`toggle-${id}`" class="custom-control-label"> </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';

@Component
export default class ToggleSettingComponent extends Vue {
  @Prop({ required: true })
  private readonly settingItem!: SettingItem;
  private value = this.settingItem.value;

  private get id(): string {
    return this.settingItem.key;
  }

  toggleButton() {
    this.value = !this.value;
    this.$emit('onChanged', this.settingItem.key, this.value);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.toggle-setting {
  padding: 8px 0;

  > .custom-control {
    padding-right: 15px;
  }

  .custom-control-label::after {
    border-radius: 0.35rem;
    cursor: pointer;
    height: 0.7rem;
    left: -2.4rem;
    top: 0.3rem;
    width: 0.7rem;
  }

  .custom-control-input:checked ~ .custom-control-label::after {
    background-color: var(--primary);
    background-size: cover;
  }

  .custom-control-label {
    font-weight: bold;
    letter-spacing: 0.27px;
    padding-left: 4px;
  }
}
</style>
