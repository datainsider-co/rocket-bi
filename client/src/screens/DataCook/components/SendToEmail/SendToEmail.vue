<template>
  <EtlModal
    class="send-to-email"
    ref="modal"
    @submit="submit"
    @hidden="resetModel"
    :loading="loading"
    :actionName="actionName"
    title="Send To Email"
    :width="500"
  >
    <form @submit.prevent="" v-if="model" class="send-to-email-form">
      <vuescroll :ops="scrollConfig">
        <div ref="scrollBody" class="scroll-body">
          <div class="mar-b-12">
            <div class="title mb-2">To</div>
            <TagsInput
              id="email"
              :default-tags="defaultListReceivers"
              placeholder="Recipients"
              :addOnKey="[13, ',', ';', ' ']"
              :validations="emailValidations"
              :avoidDuplicate="false"
              :is-duplicate="() => false"
              @tagsChanged="handleListEmailChanged"
            >
            </TagsInput>
            <template v-if="$v.model.receivers.$error">
              <div ref="errorEmailElement" v-if="!$v.model.receivers.requiredReceivers" class="mt-1 error">Emails are required.</div>
              <div ref="errorEmailElement" v-else-if="!$v.model.receivers.validReceivers" class="mt-1 error">Emails are not valid.</div>
            </template>
          </div>
          <div class="mar-b-12">
            <div class="title mb-2">Subject</div>
            <BFormInput autocomplete="off" class="mar-b-12 text-truncate" placeholder="Input email subject" v-model="model.subject"></BFormInput>
            <template v-if="$v.model.subject.$error">
              <div ref="errorSubjectElement" v-if="!$v.model.subject.required" class="mt-1 error">Subject is required.</div>
            </template>
          </div>
          <div class="mar-b-12">
            <div class="title mb-2">Descriptions</div>
            <BFormTextarea
              autocomplete="off"
              class="description mar-b-12 text-truncate"
              placeholder="Input description"
              v-model="model.content"
            ></BFormTextarea>
          </div>
          <ToggleSetting class="group-config mar-b-12" id="enabled-zip-id" :value="model.isZip" label="Enable zip" @onChanged="value => (model.isZip = value)">
          </ToggleSetting>
          <template v-for="(fileName, index) in model.fileNames">
            <div :key="index"><i class="di-icon-attach mr-2"></i>{{ fileName }}.csv</div>
          </template>
          <input type="submit" class="d-none" />
        </div>
      </vuescroll>
    </form>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Inject, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { EmailConfiguration, ETL_OPERATOR_TYPE, EtlOperator, SendToGroupEmailOperator, TableConfiguration } from '@core/DataCook';
import SelectDatabaseAndTable from '@/screens/DataCook/components/SelectDatabaseAndTable/SelectDatabaseAndTable.vue';
import OracleSourceInfo from '@/screens/DataCook/components/SaveToDatabase/OracleSourceForm/OracleSourceInfo.vue';
import DestConfigurationForm from '@/screens/DataCook/components/SaveToDatabase/OracleSourceForm/DestConfigurationForm.vue';
import { Log } from '@core/utils';
import { VerticalScrollConfigs } from '@/shared';
import MySQLSourceInfo from '@/screens/DataCook/components/SaveToDatabase/MySQLSourceForm/MySQLSourceInfo.vue';
import MySQLDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/MySQLSourceForm/MySQLDestConfigForm.vue';
import MsSQLSourceInfo from '@/screens/DataCook/components/SaveToDatabase/MsSQLSourceForm/MsSQLSourceInfo.vue';
import MsSQLDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/MsSQLSourceForm/MsSQLDestConfigForm.vue';
import PostgresSourceInfo from '@/screens/DataCook/components/SaveToDatabase/PostgresSourceForm/PostgresSourceInfo.vue';
import PostgresDestConfigForm from '@/screens/DataCook/components/SaveToDatabase/PostgresSourceForm/PostgresDestConfigForm.vue';
import { StringUtils } from '@/utils/string.utils';
import { ListUtils } from '@/utils';
import { required } from 'vuelidate/lib/validators';
import { cloneDeep, isFunction } from 'lodash';
import TagsInput from '@/shared/components/TagsInput.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation/TrackingAnotation';

// type TEmailConfigurationCallback = (emailConfiguration: EmailConfiguration, index: number) => void;

const validReceivers = (receivers: string[]) => {
  return !receivers.some(mail => !StringUtils.isEmailFormat(mail));
};
const requiredReceivers = (receivers: string[]) => ListUtils.isNotEmpty(receivers);
@Component({
  components: {
    MsSQLDestConfigForm,
    MsSQLSourceInfo,
    PostgresDestConfigForm,
    PostgresSourceInfo,
    MySQLSourceInfo,
    DestConfigurationForm,
    OracleSourceInfo,
    EtlModal,
    SelectDatabaseAndTable,
    MySQLDestConfigForm,
    TagsInput
  },
  validations: {
    model: {
      subject: { required },
      receivers: { validReceivers, requiredReceivers }
    }
  }
})
export default class SendToEmail extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;

  private model: SendToGroupEmailOperator | null = null;
  private callback: ((operator: SendToGroupEmailOperator) => void) | null = null;
  @Inject()
  private readonly makeDestTableConfig!: (operators: EtlOperator[], newOperatorType: ETL_OPERATOR_TYPE) => TableConfiguration;
  private isUpdate = false;
  private loading = false;

  private defaultListReceivers: string[] = [];

  @Ref()
  private readonly modal!: EtlModal;

  @Ref()
  private errorEmailElement!: HTMLDivElement;

  @Ref()
  private errorSubjectElement!: HTMLDivElement;

  @Ref()
  private scrollBody!: HTMLDivElement;

  private get actionName() {
    return this.isUpdate ? 'Update' : 'Add';
  }

  protected get emailValidations() {
    return [
      {
        classes: 'mail-not-valid',
        rule: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      }
    ];
  }

  @Track(TrackEvents.ETLEditSaveToEmail)
  showEditModal(operator: SendToGroupEmailOperator, callback: (operator: SendToGroupEmailOperator) => void) {
    this.callback = callback;
    this.isUpdate = true;
    this.model = cloneDeep(operator);
    this.defaultListReceivers = this.model?.receivers ?? [];
    this.modal.show();
  }

  @Track(TrackEvents.ETLSaveToEmail)
  showCreateModal(operators: EtlOperator[], callback: (operator: SendToGroupEmailOperator) => void) {
    this.callback = callback;
    this.isUpdate = false;
    const tableConfiguration: TableConfiguration = this.makeDestTableConfig(operators, ETL_OPERATOR_TYPE.SendToGroupEmailOperator);
    const fileNames: string[] = operators.map(operator => operator.destTableDisplayName);
    this.model = new SendToGroupEmailOperator(operators, tableConfiguration, [], [], [], '', fileNames, '', '', false);
    this.model!.fileNames = fileNames;
    this.defaultListReceivers = [];
    this.modal.show();
  }

  private resetModel() {
    Log.debug('onHidden');
    this.model = null;
    this.callback = null;
    this.loading = false;
    this.$v.model.$reset();
  }

  @Track(TrackEvents.ETLSubmitSaveToEmail)
  private async submit() {
    if (this.isFormValid()) {
      if (this.model && isFunction(this.callback)) {
        this.callback(this.model!);
      }
      this.modal.hide();
    } else {
      this.scrollToErrorMessage();
    }
  }

  private isFormValid() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    } else {
      return true;
    }
  }

  private scrollToErrorMessage() {
    if (this.errorEmailElement) {
      this.errorEmailElement.scrollIntoView({ behavior: 'smooth' });
    } else if (this.errorSubjectElement) {
      this.errorSubjectElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private handleListEmailChanged(data: any[]) {
    this.model!.receivers = data.map(tags => tags['text']);
  }
}
</script>
<style lang="scss" scoped>
label.di-radio {
  opacity: 1;
}

.send-to-email {
  .mail-not-valid {
    background: var(--danger);
  }

  .scroll-body {
    max-height: 389px;
    padding-right: 24px;
  }

  input {
    min-height: 34px !important;
    padding: 0 16px;
  }

  .title {
    margin-bottom: 8px;
    line-height: 1;
  }

  .description {
    resize: none;
    height: 122px;
    padding: 5px 16px;

    &::placeholder {
      padding-top: 5px;
    }
  }

  ::v-deep {
    .select-container {
      height: 34px;

      button {
        height: 34px;
      }

      ul li {
        height: 34px;
      }

      button {
        div {
          height: 34px;
        }
      }
    }

    .form-group.di-theme {
      margin-bottom: 0;
    }
  }

  .persist-configuration-info {
    ::v-deep {
      input {
        padding: 0 12px;
        min-height: 34px !important;
      }
    }
  }

  .database-table-selection {
    ::v-deep {
    }
  }
}
</style>

<style lang="scss">
.send-to-email-form {
  background-color: var(--secondary);
  padding: 24px 0 24px 24px;
  border-radius: 4px;

  .ti-input {
    max-height: unset;
    .ti-content {
      font-size: 13px;
      font-weight: normal;
    }
  }

  .ti-new-tag-input,
  .ti-new-tag-input-wrapper > input {
    background: transparent;
    font-size: 14px;
    padding: 0 3px;

    &::placeholder {
      font-size: 12px;
      color: var(--secondary-text-color);
      opacity: 1;
    }
  }
}
</style>
