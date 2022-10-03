<template>
  <div class="tsl-config">
    <div class="d-flex row pl-3 cursor-pointer" @click="handleEnable(!internalConfig.enable)">
      <DiToggle id="enable-ssl-config" :value="internalConfig.enable" />
      <div>Enable TLS/SSL Config</div>
    </div>
    <b-collapse :visible="internalConfig.enable" class="mt-2">
      <div class="title">Certificate key file</div>
      <b-form-file
        :id="genInputId('certificate-file')"
        ref="cerFileInput"
        v-model="internalConfig.certificateFile"
        :state="Boolean(internalConfig.certificateFile)"
        class="mar-b-12 text-truncate"
        drop-placeholder="Drop file here..."
        placeholder="Choose a file or drop it here..."
      ></b-form-file>
      <div class="title">Certificate key password</div>
      <BFormInput
        :id="genInputId('certificate-password')"
        v-model="internalConfig.certificatePass"
        autocomplete="off"
        class="mar-b-12 text-truncate px-2"
        placeholder="Input certificate password"
        type="password"
      ></BFormInput>
      <div class="title">CA file</div>
      <b-form-file
        :id="genInputId('ca-file')"
        ref="caFileInput"
        v-model="internalConfig.caFile"
        :state="Boolean(internalConfig.caFile)"
        class="mar-b-12 text-truncate"
        drop-placeholder="Drop file here..."
        placeholder="Choose a file or drop it here..."
      ></b-form-file>
    </b-collapse>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';
import { BFormFile } from 'bootstrap-vue';
import ToggleSetting from '@/shared/settings/common/ToggleSetting.vue';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { cloneDeep } from 'lodash';

export interface TSLUIConfig {
  enable: boolean;
  certificateFile: File | null;
  certificateData: string;
  certificatePass: string;
  caFile: File | null;
  caData: string;
}

@Component({
  components: { DiToggle, DiDropdown, ToggleSetting }
})
export default class TSLForm extends Vue {
  @Prop()
  config!: TSLUIConfig;
  @Ref()
  private cerFileInput!: BFormFile;
  @Ref()
  private caFileInput!: BFormFile;

  private internalConfig: TSLUIConfig = {
    enable: false,
    certificateFile: null,
    certificateData: '',
    certificatePass: '',
    caFile: null,
    caData: ''
  };

  mounted() {
    this.internalConfig = cloneDeep(this.config);
    //set file name certificate
    if (this.internalConfig.certificateFile) {
      this.cerFileInput.$el.children[1].innerHTML = this.internalConfig.certificateFile.name;
    }
    //init file name ca
    if (this.internalConfig.caFile) {
      this.caFileInput.$el.children[1].innerHTML = this.internalConfig.caFile.name;
    }
  }

  handleEnable(enable: boolean) {
    this.internalConfig.enable = enable;
    this.$emit('enable', enable);
  }

  @Watch('internalConfig.certificateFile')
  handleCertificateFileChanged(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    if (file.type !== 'text/plain') {
      reader.onload = e => {
        this.internalConfig.certificateData = this.getBase64Data((e.target as any).result as string);
        this.emitTSLUIConfig(this.internalConfig);
      };
      reader.onerror = function(error) {
        Log.debug('Error: ', error);
      };
    }

    // this.emitSSLUIConfig(this.internalConfig);
  }

  @Watch('internalConfig.caFile')
  handleCAFileChanged(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    if (file.type !== 'text/plain') {
      reader.onload = e => {
        this.internalConfig.caData = this.getBase64Data((e.target as any).result as string);
        this.emitTSLUIConfig(this.internalConfig);
      };
      reader.onerror = function(error) {
        Log.debug('Error: ', error);
      };
    }
  }

  emitTSLUIConfig(newConfig: TSLUIConfig) {
    if (newConfig.enable) {
      this.$emit('changed', this.internalConfig);
    } else {
      this.$emit('changed', null);
    }
  }

  @Watch('internalConfig.certificatePass')
  onKeyStorePasswordChange() {
    this.emitTSLUIConfig(this.internalConfig);
  }

  private getBase64Data(urlData: string): string {
    return ListUtils.getLast(urlData.split(',')) ?? '';
  }
}
</script>

<style lang="scss">
.tsl-config {
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
