<template>
  <div v-if="source" class="source-config mb-3">
    <div class="source-config-form">
      <DiInputComponent2 v-model="source.host" autofocus :error="hostErrorMsg" requireIcon label="Host" placeholder="Input host" />
      <DiInputComponent2 v-model="source.port" type="number" :error="portErrorMsg" requireIcon label="Port" placeholder="Input port" />
      <DiInputComponent2 v-model="source.username" :error="usernameErrorMsg" requireIcon label="Username" placeholder="Input username" />
      <DiInputComponent2 v-model="source.password" type="password" label="Password" placeholder="Input password" />
      <DiInputComponent2 v-model="source.database" :error="databaseErrorMsg" requireIcon label="Database" placeholder="Input database" />
    </div>
    <SSHTunnel ref="sshConfigComponent" @loadPublicKeyError="emitLoadPublicKeyError" @change="handleSSHConfigChanged"></SSHTunnel>
    <AddPropertiesComponent :value="propertyDataList" @change="onPropertiesChange"></AddPropertiesComponent>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Ref } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { RedshiftConnector, SSHConfig } from '@core/connector-config';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { required } from 'vuelidate/lib/validators';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { DIException } from '@core/common/domain';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import SSHTunnel from '@/screens/organization-settings/views/connector-config/components/ssh-tunnel/SSHTunnel.vue';
import AddPropertiesComponent, {
  AddPropertyData
} from '@/screens/organization-settings/views/connector-config/components/connector-form/connector-form-impl/AddPropertiesComponent.vue';
import { AbstractConnectorForm } from '@/screens/organization-settings/views/connector-config/components/connector-form/AbstractConnectorForm';

@Component({
  components: { AddPropertiesComponent, DiInputComponent2, DiIconTextButton, DiToggle, SSHTunnel },
  validations: {
    source: {
      host: { required },
      port: { required },
      username: { required },
      database: { required }
    }
  }
})
export default class RedshiftConnectorForm extends AbstractConnectorForm<RedshiftConnector> {
  @PropSync('model')
  source!: RedshiftConnector;

  protected propertyDataList: AddPropertyData[] = [];

  @Ref()
  sshConfigComponent?: SSHTunnel;

  mounted() {
    Log.debug('PostgreSQLSourceForm::mounted::', this.source);
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
      throw new DIException('MySQL source is invalid');
    }
    this.sshConfigComponent?.valid();
  }

  resetValidate() {
    this.$v.$reset();
  }

  protected get hostErrorMsg(): string {
    if (!this.$v.source?.host?.$error) {
      return '';
    }
    if (!this.$v.source.host.required) {
      return 'Host is required!';
    }

    return '';
  }
  protected get portErrorMsg(): string {
    if (!this.$v.source?.port?.$error) {
      return '';
    }
    if (!this.$v.source.port.required) {
      return 'Port is required!';
    }

    return '';
  }

  protected get databaseErrorMsg(): string {
    if (!this.$v.source?.database?.$error) {
      return '';
    }
    if (!this.$v.source.database.required) {
      return 'Database is required!';
    }

    return '';
  }

  protected get usernameErrorMsg(): string {
    if (!this.$v.source?.username?.$error) {
      return '';
    }
    if (!this.$v.source.username.required) {
      return 'Username is required!';
    }

    return '';
  }

  protected handleSSHConfigChanged(sshConfig: SSHConfig) {
    this.source.tunnelConfig = sshConfig;
  }

  setSSHConfig() {
    Log.debug('PostgresSQLSourceForm::setSSHConfig::', this.sshConfigComponent, this.source.tunnelConfig);
    this.sshConfigComponent?.setConfig(this.source.tunnelConfig);
  }

  resetSSHConfig() {
    this.sshConfigComponent?.reset();
  }
}
</script>

<style lang="scss" src="./source-config.scss" />
