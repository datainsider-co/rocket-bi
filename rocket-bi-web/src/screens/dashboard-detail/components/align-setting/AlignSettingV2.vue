<template>
  <div class="align-v2-setting">
    <div class="align-v2-setting--title">
      {{ title }}
    </div>
    <DiButtonGroup ref="textStyleSetting" class="align-v2-setting--setting" :buttons="alignOptions" @select="btn => selectTextStyle(btn.id)" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Ref } from 'vue-property-decorator';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { TextAlign } from '@/screens/dashboard-detail/components/align-setting/TextAlign';

@Component({
  components: {
    DiButtonGroup
  }
})
export default class TextStyleSetting extends Vue {
  @Prop({ type: String, default: 'Font style' })
  title!: string;

  @Prop({ type: String, required: true })
  settingValue!: string;

  private get alignOptions(): ButtonInfo[] {
    return [
      {
        displayName: '',
        isActive: this.settingValue === TextAlign.Left,
        tooltip: 'Left',
        imgSrc: 'align-text-left.svg',
        id: TextAlign.Left
      },
      {
        displayName: '',
        isActive: this.settingValue === TextAlign.Center,
        id: TextAlign.Center,
        imgSrc: 'align-text-center.svg',
        tooltip: 'Center'
      },
      {
        displayName: '',
        isActive: this.settingValue === TextAlign.Right,
        id: TextAlign.Right,
        imgSrc: 'align-text-right.svg',
        tooltip: 'Right'
      }
    ];
  }

  private selectTextStyle(style: TextAlign) {
    this.$emit('change', style);
  }
}
</script>

<style lang="scss">
.align-v2-setting {
  &--setting {
    border-radius: 5.662px;
    > .btn {
      height: 40px;
      margin-left: 0;
      box-sizing: border-box;
      border: 1px solid #e4e7ec !important;
    }

    .btn-secondary {
      background: var(--secondary) !important;
      color: var(--secondary-text-color) !important;
      padding-left: 27.84px;
      padding-right: 27.84px;

      &[actived] {
        background: #d6d6d6 !important;
        color: var(--secondary-text-color) !important;
      }

      &:hover {
        background: #f0f0f0 !important;
      }
    }
  }
}
</style>
