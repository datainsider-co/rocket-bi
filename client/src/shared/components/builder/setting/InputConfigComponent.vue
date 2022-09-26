<template>
  <div class="setting-container no-gutters" v-click-outside="handleClickOutside">
    <div class="col-3 label text-break">{{ settingItem.name }}</div>
    <b-input-group class="col-9 form-control">
      <b-form-input
        :id="genInputId(`${settingItem.key}`)"
        v-model="value"
        type="text"
        autocomplete="off"
        @blur="handleUnFocusInput"
        @focus="handleFocusInput"
        @keydown.enter="handleSave"
        ref="input"
      />
      <!--      <b-input-group-append v-show="isShowSaving">-->
      <!--        <img :id="genBtnId(`${settingItemSynced.key}-cancel`)" src="@/assets/icon/ic-close-16.svg" alt="Cancel" @click="handleCancel" />-->
      <!--        <img :id="genBtnId(`${settingItemSynced.key}-save`)" src="@/assets/icon/ic-16-save.svg" alt="Save" @click="handleSave" />-->
      <!--      </b-input-group-append>-->
    </b-input-group>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';
import ClickOutside from 'vue-click-outside';

@Component({
  directives: {
    ClickOutside
  }
})
export default class InputConfigComponent extends Vue {
  private currentValue: string | null = null;
  private isShowSaving = false;

  @Prop({ required: true })
  settingItem!: SettingItem;

  @Ref()
  private input!: any;

  private get value(): string {
    return this.currentValue ?? this.settingItem.value;
  }

  private set value(newValue: string) {
    this.currentValue = newValue;
  }

  private handleCancel() {
    this.currentValue = this.settingItem.value;
    this.handleClickOutside();
  }

  private handleSave() {
    // this.settingItem.value = this.value;
    // this.handleClickOutside();
    this.input?.blur();
    this.$emit('onChanged', this.settingItem.key, this.value);
  }

  private handleFocusInput() {
    this.isShowSaving = true;
  }
  private handleUnFocusInput() {
    this.$emit('onChanged', this.settingItem.key, this.value);
  }

  private handleClickOutside() {
    // this.$emit('onChanged', this.settingItem.key, this.value);
    if (this.isShowSaving) {
      this.isShowSaving = false;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';
@import '~@/themes/scss/_button.scss';

.input-group {
  input {
    padding: 10px 16px !important;

    @include media-breakpoint-down(lg) {
      padding: 5px 10px !important;
    }
  }

  .input-group-append {
    img {
      margin-right: 8px;
      padding: 8px;

      @include media-breakpoint-down(lg) {
        margin-right: 0;
        //padding: 8px;
      }
    }
  }
}
</style>
