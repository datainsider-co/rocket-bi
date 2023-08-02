<template>
  <div class="font-style-setting">
    <div class="font-style-setting--title">
      {{ title }}
    </div>
    <DiButtonGroup ref="textStyleSetting" class="font-style-setting--setting" :buttons="textStyles" @select="btn => selectTextStyle(btn.id)" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Ref } from 'vue-property-decorator';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { TextStyle } from '@/screens/dashboard-detail/components/text-style-setting/TextStyle';

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

  private get textStyles(): ButtonInfo[] {
    return [
      {
        displayName: '',
        isActive: this.settingValue === TextStyle.Bold,
        tooltip: 'Bold',
        id: TextStyle.Bold,
        imgSrc: 'text-bold.svg'
      },
      {
        displayName: '',
        isActive: this.settingValue === TextStyle.Italic,
        id: TextStyle.Italic,
        tooltip: 'Italic',
        imgSrc: 'text-italic.svg'
      },
      {
        displayName: '',
        isActive: this.settingValue === TextStyle.Underline,
        id: TextStyle.Underline,
        imgSrc: 'text-underline.svg',
        tooltip: 'Underline'
      }
    ];
  }

  private selectTextStyle(style: TextStyle) {
    this.$emit('change', style);
  }
}
</script>

<style lang="scss">
.font-style-setting {
  &--setting {
    border-radius: 5.662px;
    > .btn {
      height: 40px;
      margin-left: 0;
      box-sizing: border-box;
      border: 1px solid #e7ebee !important;
    }
    .btn-secondary {
      background: var(--secondary) !important;
      color: var(--secondary-text-color) !important;
      padding-left: 14px;
      padding-right: 14px;

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
