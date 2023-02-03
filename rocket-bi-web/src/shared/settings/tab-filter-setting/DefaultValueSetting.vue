<template>
  <div>
    <div class="d-flex flex-row">
      <p class="label mb-2">{{ title }}</p>
      <span v-if="showHint" :id="`tooltip-default`" class="di-icon-help ml-2"></span>
      <b-tooltip v-if="showHint" :target="`tooltip-default`" triggers="hover">
        <div v-html="hint" />
      </b-tooltip>
    </div>
    <div class="d-flex flex-row">
      <DiButton :is-disable="!enableSetDefaultButton" class="button-set-default" title="Using value a default" @click="handleSetDefaultValue"></DiButton>
      <DiButton title="Reset" @click="handleResetDefaultValue"></DiButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DefaultFilterValue } from '@/shared';
import { StringUtils } from '@/utils';

@Component({ components: { DiButton } })
export default class DefaultValueSetting extends Vue {
  @Prop({ required: false, type: Object })
  setting?: DefaultFilterValue;

  @Prop({ required: false, type: String, default: 'Default filter' })
  title!: string;

  @Prop({ required: false, type: String, default: '' })
  hint!: string;

  private get enableSetDefaultButton(): boolean {
    return _ConfigBuilderStore.tempFilterValue != null;
  }

  private handleSetDefaultValue() {
    const defaultValue = _ConfigBuilderStore.tempFilterValue;
    if (defaultValue != null) {
      this.$emit('onSaved', defaultValue);
      _ConfigBuilderStore.setTempFilterValue(null);
    }
  }

  private handleResetDefaultValue() {
    _ConfigBuilderStore.setTempFilterValue(null);
    return this.$emit('onReset');
  }

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.button-set-default {
  ::v-deep {
    .title {
      color: var(--accent) !important;
    }
  }
}

.label {
  @include regular-text12-unselect();
  color: var(--secondary-text-color);
}
</style>
