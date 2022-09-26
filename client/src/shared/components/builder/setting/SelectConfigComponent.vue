<template>
  <div class="select-option setting-container no-gutters">
    <div class="col-3 label text-break">{{ settingItem.name }}</div>
    <DiDropdown
      :id="genDropdownId(`config-${settingItem.key}`)"
      v-model="currentValue"
      :appendAtRoot="true"
      :data="options"
      boundary="scrollParent"
      class="col-5 selection"
      labelProps="displayName"
      valueProps="id"
      @selected="handleItemSelect"
    ></DiDropdown>
  </div>
</template>

<script lang="ts">
import { SelectOption } from '@/shared';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';

@Component
export default class SelectConfigComponent extends Vue {
  @Prop({ required: true })
  settingItem!: SettingItem;
  private currentValue = this.settingItem.value;

  private get options(): SelectOption[] {
    return this.settingItem?.options ?? [];
  }
  //
  // private set currentValue(newValue: string | number) {
  //   this.settingItem.value = newValue;

  // }
  private handleItemSelect(item: SelectOption) {
    this.$emit('onChanged', this.settingItem.key, item.id);
  }
}
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/bootstrap-grid';

.select-option {
  .selection {
    margin-top: 0;

    ::v-deep {
      button {
        > div {
          height: 37px;
        }
      }
    }
  }
}
</style>
