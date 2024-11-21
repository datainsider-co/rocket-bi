<template>
  <div class="gg-setting-item">
    <DiToggle
      class="w-100"
      :label="settingItem.name"
      :value="settingItem.value"
      @update:value="value => handleIsActiveChange(settingItem.key, value)"
      label-at="left"
      is-fill
    ></DiToggle>
    <CollapseTransition v-show="settingItem.value" :delay="5000" easing="ease-in-out">
      <div class="gg-input-area">
        <label>Client Id</label>
        <input
          :id="genInputId('client-id')"
          v-model="syncedLoginSettingData.clientId"
          :class="{ 'input-danger': $v.syncedLoginSettingData.$error }"
          autocomplete="off"
          :hide-track-value="true"
          class="form-control mt-0"
          placeholder="Client ID"
          type="text"
        />
        <div v-if="$v.syncedLoginSettingData.$error">
          <div v-if="!$v.syncedLoginSettingData.clientId.required" class="text-danger">Client Id is required.</div>
        </div>
        <div class="input-domain-bar d-flex flex-column">
          <label>Domain whitelist</label>
          <div class="d-flex">
            <input
              v-model="newMailDomain"
              :class="{ 'input-danger': $v.mailDomain.$error }"
              autocomplete="off"
              class="form-control"
              placeholder="Whitelist domain (example: gmail.com)"
              type="text"
              @keydown.enter="handleAddNewMailDomain"
            />
            <DiButton primary class="add-mail-domain" title="Add" @click="handleAddNewMailDomain"></DiButton>
          </div>
        </div>
        <div v-if="$v.mailDomain.$error">
          <div v-if="!$v.newMailDomain.required" class="text-danger">Domain whitelist is required.</div>
          <div v-else-if="$v.fakeMail.$error" class="text-danger">Domain whitelist is invalid.</div>
        </div>
        <div class="chip-item-listing">
          <ChipButton
            v-for="(item, index) in syncedLoginSettingData.whitelist"
            :key="index"
            :show-icon-remove="true"
            :title="item"
            class="chip-item"
            @onRemove="handleRemoveMailDomain(index)"
          ></ChipButton>
        </div>
      </div>
    </CollapseTransition>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue, Watch } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';
import { SettingItemType } from '@/shared';
import ChipButton from '@/shared/components/ChipButton.vue';
import ToggleSettingComponent from '@/shared/components/builder/setting/ToggleSettingComponent.vue';
import { CollapseTransition } from 'vue2-transitions';
import { email, required } from 'vuelidate/lib/validators';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { LoginSettingData } from '@/screens/user-management/components/user-management/LoginSettingsModal.vue';
import { OauthConfig } from '@core/common/domain/model/oauth-config/OauthConfig';
import { Log } from '@core/utils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { UserProfile } from '@core/common/domain';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

export abstract class BaseOAuthConfigItem {
  abstract validate(): boolean;

  abstract getOAuthConfig(): OauthConfig;
}

@Component({
  components: {
    ChipButton,
    ToggleSettingComponent,
    CollapseTransition
  },
  validations: {
    newMailDomain: {
      required
    },
    fakeMail: {
      email
    },
    mailDomain: ['newMailDomain', 'fakeMail'],
    syncedLoginSettingData: {
      clientId: {
        required
      }
    }
  }
})
export default class GoogleSettingItem extends Vue implements BaseOAuthConfigItem {
  @PropSync('loginSettingData', { required: true })
  syncedLoginSettingData!: LoginSettingData;
  settingItem: SettingItem = new SettingItem('login', 'Google Login', AuthenticationModule.isActiveLoginGoogle, SettingItemType.toggle, '', []);
  private fakeMail = '';
  private newMailDomain = '';

  private get canAddMailDomain(): boolean {
    this.$v.mailDomain.$touch();
    return !this.$v.mailDomain.$invalid && !this.syncedLoginSettingData.whitelist.includes(this.newMailDomain.toLowerCase());
  }

  handleIsActiveChange(key: string, newValue: boolean) {
    this.settingItem.value = newValue;
    this.syncedLoginSettingData.isActive = newValue;
    this.trackToggleGoogleMethod(newValue);
  }

  trackToggleGoogleMethod(enable: boolean) {
    if (enable) {
      TrackingUtils.track(TrackEvents.EnableGoogleLogin, {});
    } else {
      TrackingUtils.track(TrackEvents.DisableGoogleLogin, {});
    }
  }

  public validate() {
    this.$v.syncedLoginSettingData.$touch();
    return !this.$v.syncedLoginSettingData.$invalid;
  }

  @Watch('newMailDomain')
  clearNewMailDomainInput() {
    this.$v.mailDomain.$reset();
  }

  getOAuthConfig(): OauthConfig {
    return this.syncedLoginSettingData.createGoogleOauthConfig();
  }

  private createEmail(): string {
    return `test@${this.newMailDomain}`;
  }

  private handleAddNewMailDomain() {
    this.fakeMail = this.createEmail();
    Log.debug('fake-email::', this.fakeMail);
    if (this.canAddMailDomain) {
      this.syncedLoginSettingData.whitelist = this.syncedLoginSettingData.whitelist.concat([this.newMailDomain.toLowerCase()]);
      this.$v.newMailDomain.$reset();
      this.newMailDomain = '';
      TrackingUtils.track(TrackEvents.ChangeMailWhiteList, { mail_domains: this.syncedLoginSettingData.whitelist.join(',') });
    }
  }

  private handleRemoveMailDomain(index: number) {
    this.syncedLoginSettingData.whitelist.splice(index, 1);
    TrackingUtils.track(TrackEvents.ChangeMailWhiteList, { mail_domains: this.syncedLoginSettingData.whitelist.join(',') });
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.gg-setting-item {
  display: flex;
  flex-direction: column;

  > div + div {
    margin-top: 12px;
  }

  > .di-toggle-component {
    align-self: start;
  }

  > .gg-input-area {
    display: flex;
    flex-direction: column;
    > * + * {
      margin-top: 12px;
    }

    input.form-control {
      min-height: 40px;
      padding: 12px 16px;
      @include regular-text(0.2px, var(--secondary-text-color));
      cursor: text;

      &::placeholder {
        @include regular-text(0.2px, var(--secondary-text-color));
      }
    }

    > .input-domain-bar {
      display: flex;
      flex-direction: row;

      .di-button {
        width: 80px;
        margin-left: 12px;
      }
    }

    > .chip-item-listing {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;

      > .chip-item + .chip-item {
        margin-left: 8px;
      }

      .chip-item .icon-x svg {
        color: var(--accent-text-color);
      }
    }

    .input-danger {
      border: 1px solid var(--danger);
    }
  }
}
</style>
