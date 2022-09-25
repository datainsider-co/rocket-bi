import { Prop, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { JobFormRender } from '@/screens/DataIngestion/FormBuilder/JobFormRender';
import { Job } from '@core/DataIngestion/Domain/Job/Job';

@Component
export class JobConfigForm extends Vue {
  @Prop({ required: true })
  private readonly renderEngine!: JobFormRender;

  render(h: any) {
    return this.renderEngine.render(h);
  }

  createJob(): Job {
    return this.renderEngine.createJob();
  }
}
