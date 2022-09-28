<template>
  <BPopover
    :container="container"
    :customClass="customClass"
    :placement="placement"
    :show.sync="isShowSynced"
    :target="targetId"
    :triggers="triggers"
    :id="genBtnId(`popover-${targetId}`)"
    :style="{ 'z-index': zIndex }"
    :boundary="boundary"
  >
    <slot name="custom-popover">
      <div class="custom-popover">
        <slot name="header" v-if="isShowHeader"></slot>
        <div class="custom-body">
          <slot name="body-title" v-if="isShowTitle"></slot>
          <slot></slot>
        </div>
      </div>
    </slot>
  </BPopover>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';

@Component
export default class DIPopover extends Vue {
  @PropSync('isShow', { required: true, type: Boolean })
  private isShowSynced!: boolean;

  @Prop({ required: true, type: String })
  private readonly targetId!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowHeader!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isShowTitle!: boolean;

  @Prop({ required: false, type: String, default: 'bottom' })
  private readonly placement!: string;

  @Prop({ required: false, type: String, default: 'blur' })
  private readonly triggers!: string;

  @Prop({ required: false, type: String })
  private readonly customClass!: string;

  @Prop({ required: false, type: String })
  private readonly container!: string;

  @Prop({ required: false, type: Number, default: 1060 })
  private readonly zIndex!: number;

  @Prop({ required: false, type: String })
  private readonly boundary!: string;
}
</script>

<style lang="scss" scoped>
::v-deep {
  background-color: transparent;
  border-radius: 4px;
  box-sizing: border-box;
  max-width: unset;
  text-align: left;

  .arrow {
    display: none;
  }

  .popover-body {
    padding: 0 !important;
    max-height: 500px;
    max-width: 300px;
    min-width: 262px;
  }
}

.custom-popover {
  padding: 16px;
  background-color: var(--menu-background-color);
  box-shadow: var(--menu-shadow);
  border: var(--menu-border);
}
</style>
