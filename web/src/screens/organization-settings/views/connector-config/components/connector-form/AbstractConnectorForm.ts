import { Component, Emit, PropSync, Vue } from 'vue-property-decorator';
import { Connector } from '@core/connector-config';
import { DIException } from '@core/common/domain';
import { AddPropertyData } from '@/screens/organization-settings/views/connector-config/components/connector-form/connector-form-impl/AddPropertiesComponent.vue';

// @ts-ignore
@Component
export abstract class AbstractConnectorForm<T extends Connector> extends Vue {
  @PropSync('model', { type: Object, required: true })
  protected readonly source!: T;

  public abstract valid(): void;

  public abstract resetValidate(): void;

  @Emit('loadPublicKeyError')
  emitLoadPublicKeyError(ex: DIException) {
    return ex;
  }

  protected toAddPropertyDataList(extraFields: Record<string, string>): AddPropertyData[] {
    const data: { key: string; value: string }[] = [];
    Object.keys(extraFields).forEach(key => {
      data.push({ key: key, value: extraFields[key] });
    });
    return data;
  }

  protected arrayToExtraField(array: { key: string; value: string }[]): Record<string, string> {
    const extraField: Record<string, string> = {};
    array.forEach(item => {
      extraField[item.key] = item.value;
    });
    return extraField;
  }
}
