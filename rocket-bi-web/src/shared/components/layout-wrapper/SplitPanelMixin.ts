import { Vue, Component } from 'vue-property-decorator';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
const SM_WIDTH = 576;

@Component({
  components: {
    Split,
    SplitArea
  }
})
export default class SplitPanelMixin extends Vue {
  getPanelSizeHorizontal() {
    if (window.$(window).width() <= SM_WIDTH) {
      return [0, 100];
    }
    return [25, 75];
  }
}
