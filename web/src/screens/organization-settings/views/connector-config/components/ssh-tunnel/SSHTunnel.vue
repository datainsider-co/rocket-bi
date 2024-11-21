<template>
  <div class="ssh-tunnel">
    <div class="ssh-tunnel--header" @click="toggleCollapse">
      <div class="ssh-tunnel--header--title">
        Connect using an SSH tunnel
      </div>
      <div class="ssh-tunnel--header--icon">
        <img src="@/assets/icon/down.svg" alt="icon down" />
      </div>
    </div>
    <BCollapse class="ssh-tunnel--collapse" :visible="isShow">
      <div class="ssh-tunnel--collapse--container">
        <div class="ssh-tunnel--collapse--row">
          <div class="ssh-tunnel--collapse--row--item">
            <div class="ssh-tunnel--collapse--row--item--label">
              SSH Host
            </div>
            <BFormInput
              autofocus
              autocomplete="off"
              :class="{ error: $v.sshConfig.host.$error }"
              class=" text-truncate"
              v-model="sshConfig.host"
              placeholder="ex: rocket-bi.ddns.net"
              @keydown.enter="submit"
            ></BFormInput>
            <div v-if="$v.sshConfig.host.$error" class="error-message">
              Host is required
            </div>
          </div>
          <div class="ssh-tunnel--collapse--row--item">
            <div class="ssh-tunnel--collapse--row--item--label">
              SSH Port
            </div>
            <BFormInput
              type="number"
              autocomplete="off"
              :class="{ error: $v.sshConfig.port.$error }"
              class=" text-truncate"
              v-model="sshConfig.port"
              placeholder="ex: 22"
              @keydown.enter="submit"
            ></BFormInput>
            <div v-if="$v.sshConfig.port.$error" class="error-message">
              Port is required
            </div>
          </div>
        </div>
        <div class="ssh-tunnel--collapse--row">
          <div class="ssh-tunnel--collapse--row--item">
            <div class="ssh-tunnel--collapse--row--item--label">
              SSH Username
            </div>
            <BFormInput
              autocomplete="off"
              :class="{ error: $v.sshConfig.username.$error }"
              class=" text-truncate"
              v-model="sshConfig.username"
              placeholder="ex: datainsider"
              @keydown.enter="submit"
            ></BFormInput>
            <div v-if="$v.sshConfig.username.$error" class="error-message">
              Username is required
            </div>
          </div>
          <div class="ssh-tunnel--collapse--row--item">
            <div class="ssh-tunnel--collapse--row--item--label">
              Public Key
            </div>
            <BFormInput
              readonly
              autocomplete="off"
              :class="{ error: $v.sshConfig.publicKey.$error }"
              class=" text-truncate"
              v-model="sshConfig.publicKey"
              @keydown.enter="submit"
            ></BFormInput>
            <div v-if="$v.sshConfig.publicKey.$error" class="error-message">
              Public key is required
            </div>
            <Spinner class="spinner" v-if="publicKeyLoading" />
            <a-tooltip v-model="isShowCopyTooltip" v-else class="copy" trigger="click" placement="bottom">
              <template slot="title">
                <span>Copied</span>
              </template>
              <i class="copy di-icon-copy" @click="handleCopyPublicKey"></i>
            </a-tooltip>
          </div>
        </div>
      </div>
    </BCollapse>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { SSHConfig } from '@core/connector-config';
import { required } from 'vuelidate/lib/validators';
import { DIException } from '@core/common/domain';
import Spinner from '@/shared/components/Spinner.vue';
import { Log } from '@core/utils';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { StringUtils, TimeoutUtils } from '@/utils';

@Component({
  components: {
    Spinner
  },
  validations: {
    sshConfig: {
      host: { required },
      port: { required },
      username: { required },
      publicKey: { required }
    }
  }
})
export default class SSHTunnel extends Vue {
  private isShow = false;
  private publicKeyLoading = true;
  private isShowCopyTooltip = false;
  sshConfig: SSHConfig = SSHConfig.default();

  public setConfig(config?: SSHConfig) {
    if (config) {
      this.sshConfig = config;
    }
  }

  public valid() {
    if (StringUtils.isNotEmpty(this.sshConfig.port) || StringUtils.isNotEmpty(this.sshConfig.host) || StringUtils.isNotEmpty(this.sshConfig.username)) {
      this.$v.$touch();
      if (this.$v.$invalid) {
        throw new DIException('SSH tunnel config is invalid');
      }
    } else {
      this.$v.$reset();
    }
  }

  public reset() {
    this.setConfig(SSHConfig.default());
    this.$v.$reset();
  }

  private toggleCollapse() {
    this.isShow = !this.isShow;
    if (this.isShow) {
      this.handleLoadSSHPublicKey();
    }
  }

  private async handleLoadSSHPublicKey() {
    try {
      if (!this.sshConfig.publicKey) {
        this.publicKeyLoading = true;
        await ConnectionModule.loadSSHPublicKey();
        this.sshConfig.publicKey = ConnectionModule.SSHPublicKey;
      }
    } catch (e) {
      Log.error('SSHTunnel::handleLoadSSHPublicKey::error::', e);
      this.$emit('loadPublicKeyError', DIException.fromObject(e));
    } finally {
      this.publicKeyLoading = false;
    }
  }

  private async handleCopyPublicKey() {
    try {
      this.isShowCopyTooltip = true;
      await navigator.clipboard.writeText(this.sshConfig.publicKey);
      await TimeoutUtils.sleep(1000);
    } catch (e) {
      Log.error('SSHTunnel::handleCopyPublicKey::error::', e);
    } finally {
      this.isShowCopyTooltip = false;
    }
  }

  private submit() {
    this.$emit('submit');
  }

  private emitSSHConfig() {
    this.$emit('change', this.sshConfig);
  }

  @Watch('sshConfig.username')
  onUsernameChanged() {
    this.emitSSHConfig();
  }

  @Watch('sshConfig.host')
  onHostChanged() {
    this.emitSSHConfig();
  }

  @Watch('sshConfig.port')
  onPortChanged() {
    this.emitSSHConfig();
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';
.ant-tooltip-arrow::before {
  background: #009c31 !important;
}
.ant-tooltip-inner {
  background: #009c31 !important;
  border-radius: 4px;
  color: var(--white);
  font-size: 14px;
  letter-spacing: 0.18px;
  padding: 4px 12px;
  text-align: center;
  display: flex;
  align-items: center;
}

.ssh-tunnel {
  width: 100%;
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

  .form-control[readonly='readonly'] {
    pointer-events: none;
    background: #f0f0f0;
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

  &--header {
    display: flex;
    align-items: center;
    cursor: pointer;
    justify-content: space-between;

    &--title {
      font-family: Roboto;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 19.6px;
    }

    &--icon {
      margin-right: 2px;
    }
  }

  &--collapse {
    .ssh-tunnel--collapse--container {
      display: flex;
      flex-direction: column;
    }
    &--row {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-top: 24px;

      &--item {
        display: flex;
        flex-direction: column;
        width: 50%;
        position: relative;

        .spinner,
        .copy {
          padding: 4px 4px 0;
          position: absolute;
          bottom: 12px;
          right: 10px;
        }

        .copy {
          background: #f0f0f0;
          cursor: pointer;
          font-size: 16px;
        }

        &--label {
          color: #212b36;
          font-family: Roboto;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 19.6px;
          margin-bottom: 4px;
        }

        input {
        }
      }
    }
  }
}
</style>
