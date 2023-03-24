<template>
  <div ref="copyButton" :id="genBtnId(`quick-copy-${id}`)">
    <slot :copy="copy">
      <a class="mr-2 copy-link" href="#" @click.stop="copy(text)">
        Copy link
      </a>
    </slot>
    <b-tooltip custom-class="success-copy-tooltip" :id="`success-tooltip-${id}`" :disabled="true" :target="genBtnId(`quick-copy-${id}`)" placement="left">
      <div :class="tooltipBackground" class="custom-tooltip-body">
        {{ copyStatus }}
      </div>
    </b-tooltip>
    <b-tooltip custom-class="error-copy-tooltip" :id="`error-tooltip-${id}`" :disabled="true" :target="genBtnId(`quick-copy-${id}`)" placement="left">
      <div :class="tooltipBackground" class="custom-tooltip-body">
        {{ copyStatus }}
      </div>
    </b-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';
import VueClipboard from 'vue-clipboard2';

export enum CopyStatus {
  Failed = 'Failed',
  Success = 'Copied'
}

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);
@Component({ components: {} })
export default class CopyButton extends Vue {
  static readonly SHOWING_DURATION = 1000;
  @Prop({ required: true, type: String })
  private readonly text!: string;
  @Prop({ default: '' })
  private readonly id!: string;
  @Ref()
  private readonly copyButton!: HTMLElement;

  copyStatus: CopyStatus = CopyStatus.Failed;

  copy(text: string) {
    this.$copyText(text, this.$refs.copyButton)
      .then(() => {
        //success copy link
        Log.debug('copied link:: ', text);
        this.showTooltip(`success-tooltip-${this.id}`, CopyStatus.Success, CopyButton.SHOWING_DURATION);
      })
      .catch(err => {
        //copy failed
        Log.error('Copied Failed::error::', err);
        this.showTooltip(`error-tooltip-${this.id}`, CopyStatus.Failed, CopyButton.SHOWING_DURATION);
      });
  }

  //show tooltip during showing duration time
  showTooltip(tooltipId: string, status: CopyStatus, showingDuration: number) {
    try {
      this.displayTooltipWithId(tooltipId);
      this.copyStatus = status;
      this.waitToHideTooltip(tooltipId, showingDuration);
    } catch (e) {
      Log.debug('DiShareModel::ShowTooltip::Err::', e.message);
    }
  }

  displayTooltipWithId(tooltipId: string) {
    this.$root.$emit('bv::show::tooltip', tooltipId);
  }

  private get tooltipBackground() {
    return {
      'tooltip-basic-bg': this.copyStatus === CopyStatus.Failed,
      'tooltip-success-bg': this.copyStatus === CopyStatus.Success
    };
  }

  private waitToHideTooltip(tooltipId: string, showingDuration: number) {
    return setTimeout(() => {
      this.$root.$emit('bv::hide::tooltip', tooltipId);
    }, showingDuration);
  }
}
</script>

<style lang="scss" scoped src="../DiShareModal.scss" />
<style lang="scss">
.success-copy-tooltip,
#success-quick-copy-tooltip {
  .arrow {
    &::before {
      border-left-color: #009c31;
      border-right-color: #009c31;
    }
  }
}
</style>
