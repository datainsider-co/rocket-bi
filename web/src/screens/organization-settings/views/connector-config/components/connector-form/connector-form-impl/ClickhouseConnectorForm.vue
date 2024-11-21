<template>
  <div v-if="source" class="clickhouse-source-config mb-3">
    <div class="clickhouse-source-config-form">
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">Host</div>
          <BFormInput
            autofocus
            autocomplete="off"
            :class="{ error: $v.source.host.$error }"
            class=" text-truncate"
            v-model="source.host"
            placeholder="Input host"
          ></BFormInput>
          <div v-if="$v.source.host.$error" class="error-message">
            Host is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required">HTTP Port</div>
          <BFormInput
            autocomplete="off"
            :class="{ error: $v.source.httpPort.$error }"
            class=" text-truncate"
            v-model="source.httpPort"
            placeholder="Input HTTP port"
            type="number"
          ></BFormInput>
          <div v-if="$v.source.httpPort.$error" class="error-message">
            HTTP Port is required
          </div>
        </div>
      </div>
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">TCP Port</div>
          <BFormInput
            autocomplete="off"
            :class="{ error: $v.source.tcpPort.$error }"
            class=" text-truncate"
            v-model="source.tcpPort"
            placeholder="Input TCP port"
            type="number"
          ></BFormInput>
          <div v-if="$v.source.tcpPort.$error" class="error-message">
            TCP Port is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title unselectable">Cluster name</div>
          <BFormInput autocomplete="off" class="text-truncate" v-model="source.clusterName" placeholder="Input cluster name"></BFormInput>
        </div>
      </div>
      <div class="clickhouse-source-config-form--row">
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title required unselectable">Username</div>
          <BFormInput
            autocomplete="new-password"
            :class="{ error: $v.source.username.$error }"
            class=" text-truncate"
            v-model="source.username"
            placeholder="Input username"
          ></BFormInput>
          <div v-if="$v.source.username.$error" class="error-message">
            TCP Port is required
          </div>
        </div>
        <div class="clickhouse-source-config-form--row--form-item">
          <div class="title">Password</div>
          <BFormInput autocomplete="new-password" class=" text-truncate" v-model="source.password" placeholder="Input password" type="password"></BFormInput>
        </div>
      </div>
    </div>

    <DiToggle class="ssl-toggle" :value.sync="source.useSsl" label="SSL Connection"></DiToggle>
    <SSHTunnel ref="sshConfigComponent" @loadPublicKeyError="emitLoadPublicKeyError" @change="handleSSHConfigChanged"></SSHTunnel>
    <AddPropertiesComponent :value="propertyDataList" @change="onPropertiesChange"></AddPropertiesComponent>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { ClickhouseConnector, SSHConfig } from '@core/connector-config';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { required } from 'vuelidate/lib/validators';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { BFormInput } from 'bootstrap-vue';
import { DIException } from '@core/common/domain';
import SSHTunnel from '@/screens/organization-settings/views/connector-config/components/ssh-tunnel/SSHTunnel.vue';
import AddPropertiesComponent, {
  AddPropertyData
} from '@/screens/organization-settings/views/connector-config/components/connector-form/connector-form-impl/AddPropertiesComponent.vue';
import { AbstractConnectorForm } from '@/screens/organization-settings/views/connector-config/components/connector-form/AbstractConnectorForm';

@Component({
  components: { AddPropertiesComponent, DiIconTextButton, DiToggle, SSHTunnel },
  validations: {
    source: {
      host: { required },
      httpPort: { required },
      tcpPort: { required },
      username: { required }
    }
  }
})
export default class ClickhouseConnectorForm extends AbstractConnectorForm<ClickhouseConnector> {
  @PropSync('model')
  source!: ClickhouseConnector;

  @Ref()
  sshConfigComponent?: SSHTunnel;

  protected propertyDataList: AddPropertyData[] = [];

  @Ref()
  protected newKeyInput?: BFormInput;

  mounted() {
    Log.debug('ClickhouseSourceForm::mounted');
    this.propertyDataList = this.toAddPropertyDataList(this.source.properties);
    this.resetValidate();
    this.$nextTick(() => {
      this.resetSSHConfig();
      this.setSSHConfig();
    });
  }

  protected onPropertiesChange(newProperties: AddPropertyData[]) {
    this.propertyDataList = newProperties;
    this.source.properties = this.arrayToExtraField(newProperties);
  }

  valid() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      throw new DIException('Clickhouse source is invalid');
    }
    this.sshConfigComponent?.valid();
  }

  resetValidate() {
    this.$v.$reset();
  }

  protected handleSSHConfigChanged(sshConfig: SSHConfig) {
    this.source.tunnelConfig = sshConfig;
  }

  setSSHConfig() {
    Log.debug('ClickhouseSourceForm::setSSHConfig::', this.sshConfigComponent, this.source.tunnelConfig);
    this.sshConfigComponent?.setConfig(this.source.tunnelConfig);
  }

  resetSSHConfig() {
    this.sshConfigComponent?.reset();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.clickhouse-source-config {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: left;

  .clickhouse-source-config-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    &--row {
      width: 100%;
      display: flex;
      align-items: flex-start;
      column-gap: 17px;

      &--form-item {
        flex: 1;
      }

      &:not(:last-child) {
        margin-bottom: 24px;
      }
    }
  }

  .ssl-toggle {
    margin-top: 30px;
    margin-bottom: 24px;
  }

  .mt-17px {
    margin-top: 17px;
  }

  .title {
    @include regular-text-14();
    font-weight: 400;
    line-height: 19.6px;
    margin-bottom: 4px;
  }

  .title.required::after {
    content: ' *';
    color: #de3618;
  }

  .form-control {
    height: 40px;
    background: transparent;
    border: 1px solid #d6d6d6;
    padding: 12px 10px;
    &:focus {
      border: 2px solid #0066ff;
      padding: 12px 9px;
    }
  }

  .form-control.error {
    border: 2px solid #de3618;
  }

  .error-message {
    margin-top: 4px;
    @include regular-text12-unselect();
    color: #de3618;
    line-height: 16px;
    font-weight: 400;
  }
}
</style>
