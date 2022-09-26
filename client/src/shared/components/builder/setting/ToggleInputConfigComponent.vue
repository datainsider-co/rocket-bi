<template>
  <div class="input-setting d-flex align-items-center">
    <input type="text" class="input-setting-form form-control text-nowrap col-3" v-model="inputValue" :disabled="!toggleValue" />
    <div class="input-toggle-setting d-flex btn-ghost" @click.prevent="toggleValueChanged">
      <div class="mr-3">Visible</div>
      <div class="custom-control custom-control-right custom-switch">
        <input v-model="toggleValue" type="checkbox" class="custom-control-input" :id="`input-toggle-${id}`" />
        <label class="custom-control-label" :for="`input-toggle-${id}`"> </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { TimeoutUtils } from '@/utils';
import { SettingItem } from '@/shared/models';

@Component
export default class ToggleInputConfigComponent extends Vue {
  private currentProcess = 0;
  private currentValue = '';

  @PropSync('settingItem', { required: true })
  settingItemSynced!: SettingItem;

  private get id(): string {
    return this.settingItemSynced.key;
  }

  private get inputValue(): string {
    return this.currentValue ?? this.settingItemSynced.value;
  }

  private set inputValue(newValue: string) {
    this.currentValue = newValue;
    this.handleInputValueChanged();
  }

  private get toggleValue(): boolean {
    return this.settingItemSynced.value;
  }

  private set toggleValue(newValue: boolean) {
    // this.settingItemSynced.value = newValue;
  }

  private toggleValueChanged(): void {
    // this.settingItemSynced.value = !this.settingItemSynced.value;
  }

  private handleInputValueChanged() {
    this.currentProcess = TimeoutUtils.waitAndExec(
      this.currentProcess,
      () => {
        this.settingItemSynced.value = this.currentValue;
      },
      1000
    );
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';

.input-toggle-setting {
  margin-left: auto;
  padding: 4px;
  cursor: pointer;
}

.input-title {
  @include regular-text12-unselect();
}

input {
  padding: 10px 16px;

  @include media-breakpoint-down(lg) {
    padding: 5px 10px;
  }
}
</style>
