import Component from 'vue-class-component';
import { Log } from '@core/utils';
import { Prop, Vue } from 'vue-property-decorator';

@Component
export default class CaptureException extends Vue {
  @Prop({ required: true, type: String })
  private name!: string;

  errorCaptured(error: any) {
    Log.info('CaptureException::succeed');
    Log.error(error);
    this.$emit('onError', error);
    this.$root.$emit('global-error', this.name, error);
    return false;
  }

  render(h: any) {
    return this.$slots.default;
  }
}
