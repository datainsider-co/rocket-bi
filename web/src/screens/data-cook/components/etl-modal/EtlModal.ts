import Modal from '@/screens/data-ingestion/components/di-upload-document/components/commons/Modal.vue';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { AtomicAction } from '@core/common/misc';

@Component({
  components: {
    Modal
  }
})
export default class EtlModal extends Vue {
  @Prop({ type: Number, default: 530 })
  private readonly width!: number;

  @Prop({ type: Boolean, default: false })
  private readonly loading!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly disabled!: boolean;

  @Prop({ type: String, default: '' })
  private readonly title!: string;

  @Prop({ type: String, default: 'Cancel' })
  private readonly backName!: string;

  @Prop({ type: String, default: 'Save' })
  private readonly actionName!: string;

  @Prop({ default: true })
  private readonly backdrop!: boolean | string;

  @Prop({ type: Boolean, default: false })
  private readonly borderCancel!: boolean;

  show() {
    // @ts-ignore
    this.$refs.modal.show();
  }

  hide() {
    // @ts-ignore
    this.$refs.modal.hide();
  }
  private cancel() {
    this.$emit('back');
    this.hide();
  }

  @AtomicAction()
  submit() {
    this.$emit('submit');
    // this.hide();
  }
}
