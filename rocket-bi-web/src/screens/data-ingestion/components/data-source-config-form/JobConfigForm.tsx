import { Prop, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { Job } from '@core/data-ingestion/domain/job/Job';

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
