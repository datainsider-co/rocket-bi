<template>
  <div class="ssl-config">
    <ToggleSetting id="y-axis-enable" :value="internalSSLConfig.enable" class="mt-3 group-config" label="SSL Configuration" @onChanged="handleEnable" />
    <b-collapse class="mt-2" :visible="internalSSLConfig.enable">
      <div class="title">Protocol</div>
      <DiDropdown
        class="mar-b-12"
        id="protocol-select"
        :data="protocols"
        value-props="value"
        label-props="label"
        v-model="internalSSLConfig.protocol"
        :append-at-root="true"
      />
      <div class="title">Key store file</div>
      <b-form-file
        ref="keyStoreFileInput"
        v-model="internalSSLConfig.keyStore"
        class="mar-b-12 text-truncate"
        :state="Boolean(internalSSLConfig.keyStore)"
        placeholder="Choose a file or drop it here..."
        drop-placeholder="Drop file here..."
        accept=".jks"
      ></b-form-file>
      <div class="title">Key store password</div>
      <BFormInput
        autocomplete="off"
        class="mar-b-12 text-truncate"
        v-model="internalSSLConfig.keyStorePass"
        placeholder="Input key store password"
        type="password"
      ></BFormInput>
      <div class="title">Trust store file</div>
      <b-form-file
        ref="trustStoreFileInput"
        v-model="internalSSLConfig.trustStore"
        class="mar-b-12 text-truncate"
        :state="Boolean(internalSSLConfig.trustStore)"
        placeholder="Choose a file or drop it here..."
        drop-placeholder="Drop file here..."
        accept=".jks"
      ></b-form-file>
      <div class="title">Trust store password</div>
      <BFormInput
        autocomplete="off"
        class="mar-b-12 text-truncate"
        v-model="internalSSLConfig.trustStorePass"
        placeholder="Input key store password"
        type="password"
      ></BFormInput>
    </b-collapse>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { Log } from '@core/utils';
import { JKSConfig, KeyStoreConfig, Protocol, SSLConfig } from '@core/DataCook';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import { toNumber } from 'lodash';
import { ListUtils } from '@/utils';
import { BFormFile } from 'bootstrap-vue';

export interface SSLUIConfig {
  enable: boolean;
  keyStore: File | null;
  keyStoreData: string;
  keyStorePass: string;
  trustStore: null | File;
  trustStoreData: string;
  trustStorePass: string;
  protocol: Protocol;
}

@Component({
  components: { DiDropdown }
})
export default class SSLForm extends Vue {
  private readonly protocols = [
    {
      label: 'TCP',
      value: Protocol.TCP
    },
    {
      label: 'TCPS',
      value: Protocol.TCPS
    }
  ];

  @Ref()
  private keyStoreFileInput!: BFormFile;

  @Ref()
  private trustStoreFileInput!: BFormFile;

  private internalSSLConfig: SSLUIConfig = {
    enable: false,
    keyStore: null,
    keyStorePass: '',
    keyStoreData: '',
    trustStore: null,
    trustStorePass: '',
    trustStoreData: '',
    protocol: Protocol.TCPS
  };

  @Prop()
  sslConfig!: SSLUIConfig;

  mounted() {
    this.internalSSLConfig = this.sslConfig;
    if (this.internalSSLConfig.keyStore) {
      this.keyStoreFileInput.$el.children[1].innerHTML = this.internalSSLConfig.keyStore.name;
    }
    if (this.internalSSLConfig.trustStore) {
      this.trustStoreFileInput.$el.children[1].innerHTML = this.internalSSLConfig.trustStore.name;
    }
  }

  handleEnable(enable: boolean) {
    this.internalSSLConfig.enable = enable;
    this.$emit('enable', enable);
  }

  @Watch('internalSSLConfig.keyStore')
  handleKeyStoreFileChanged(file: File) {
    Log.debug('defaultValue.keyStore::', file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    if (file.type !== 'text/plain') {
      reader.onload = e => {
        this.internalSSLConfig.keyStoreData = this.getBase64Data((e.target as any).result as string);
        this.emitSSLUIConfig(this.internalSSLConfig);
      };
      reader.onerror = function(error) {
        Log.debug('Error: ', error);
      };
    }

    // this.emitSSLUIConfig(this.internalSSLConfig);
  }

  @Watch('internalSSLConfig.trustStore')
  handleTrustStoreChanged(file: File) {
    Log.debug('defaultValue.keyStore::', file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    if (file.type !== 'text/plain') {
      reader.onload = e => {
        this.internalSSLConfig.trustStoreData = this.getBase64Data((e.target as any).result as string);
        this.emitSSLUIConfig(this.internalSSLConfig);
      };
      reader.onerror = function(error) {
        Log.debug('Error: ', error);
      };
    }
  }

  private getBase64Data(urlData: string): string {
    return ListUtils.getLast(urlData.split(',')) ?? '';
  }

  emitSSLUIConfig(newConfig: SSLUIConfig) {
    Log.debug('onChangeSSLUIConfig::', this.internalSSLConfig);
    if (newConfig.enable) {
      this.$emit('change', this.internalSSLConfig);
    } else {
      this.$emit('change', null);
    }
  }

  @Watch('internalSSLConfig.keyStorePass')
  onKeyStorePasswordChange() {
    this.emitSSLUIConfig(this.internalSSLConfig);
  }

  @Watch('internalSSLConfig.trustStorePass')
  onTrustStorePasswordChange() {
    this.emitSSLUIConfig(this.internalSSLConfig);
  }

  @Watch('internalSSLConfig.protocol')
  onProtocolChange() {
    this.emitSSLUIConfig(this.internalSSLConfig);
  }
}
</script>

<style lang="scss">
.ssl-config {
  .select-container {
    margin-top: 0;
  }
  .custom-file.is-valid label.custom-file-label {
    font-size: 14px;
  }

  .title {
    margin-bottom: 8px;
  }

  .custom-file-input {
    cursor: pointer;
  }

  .custom-file {
    display: flex;
    label.custom-file-label {
      display: flex;
      align-items: center;
      padding: 0 12px;
      margin: 0;
      height: 34px;

      color: var(--secondary-text-color);
      font-size: 12px;
      letter-spacing: 0.17px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: normal;

      #file-upload-button {
        font-size: 14px;
      }

      &::after {
        font-family: 'data-insider-icon' !important;
        cursor: pointer;
        content: '\e92b';
        color: var(--secondary);
        background-color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        width: 44px;
        height: 34px;
      }
    }
  }
}
</style>
