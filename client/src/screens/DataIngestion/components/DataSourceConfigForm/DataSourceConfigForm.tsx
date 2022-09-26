import { Prop, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';

@Component
export class DataSourceConfigForm extends Vue {
  @Prop({ required: true })
  private readonly formRender!: DataSourceFormRender;

  render(h: any) {
    return this.formRender.renderForm(h);
  }

  createDataSourceInfo(): DataSourceInfo {
    return this.formRender.createDataSourceInfo();
  }
}
