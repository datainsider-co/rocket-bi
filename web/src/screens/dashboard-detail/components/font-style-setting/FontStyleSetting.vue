<template>
  <div class="font-style-setting">
    <div class="font-style-setting--title">
      {{ title }}
    </div>
    <DiButtonGroup ref="textStyleSetting" class="font-style-setting--setting" is-multi-select :buttons="textStyles" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';

@Component({
  components: {
    DiButtonGroup
  }
})
export default class FontStyleSetting extends Vue {
  @Prop({ type: String, default: 'Font style' })
  protected readonly title!: string;

  @PropSync('isBold', { type: Boolean, default: false })
  protected isBoldValue!: boolean;

  @PropSync('isItalic', { type: Boolean, default: false })
  protected isItalicValue!: boolean;

  @PropSync('isUnderline', { type: Boolean, default: false })
  protected isUnderlineValue!: boolean;

  private get textStyles(): ButtonInfo[] {
    return [
      {
        displayName: '',
        isActive: this.isBoldValue,
        tooltip: 'Bold',
        id: 'bold',
        imgSrc: 'text-bold.svg',
        onClick: (event, isSelected) => {
          this.isBoldValue = isSelected;
        }
      },
      {
        displayName: '',
        isActive: this.isItalicValue,
        id: 'italic',
        tooltip: 'Italic',
        imgSrc: 'text-italic.svg',
        onClick: (event, isSelected) => {
          this.isItalicValue = isSelected;
        }
      },
      {
        displayName: '',
        isActive: this.isUnderlineValue,
        id: 'underline',
        imgSrc: 'text-underline.svg',
        tooltip: 'Underline',
        onClick: (event, isSelected) => {
          this.isUnderlineValue = isSelected;
        }
      }
    ];
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
