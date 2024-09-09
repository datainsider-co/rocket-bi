<script lang="ts">
import { Component, Model, Vue } from 'vue-property-decorator';
import { GoogleOauthConfig } from '@core/common/domain';
import ChipButton from '@/shared/components/ChipButton.vue';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { email, required } from 'vuelidate/lib/validators';
import { CollapseTransition } from 'vue2-transitions';
import { SSOConfig } from '@/screens/organization-settings/views/sso-config/component/config/SSOConfig';

@Component({
  components: { DiButton, DiToggle, ChipButton, CollapseTransition },
  validations: {
    configName: {
      required
    },
    newMailDomain: {
      required
    },
    fakeMail: {
      email
    },
    mailDomain: ['newMailDomain', 'fakeMail'],
    clientId: {
      required
    }
  }
})
export default class GoogleSSOConfig extends Vue implements SSOConfig {
  @Model('change', { type: Object, default: () => null })
  config!: GoogleOauthConfig;

  fakeMail = '';
  newMailDomain = '';

  get title(): string {
    return 'Google Login';
  }

  get clientId(): string {
    return this.config.clientIds[0] ?? '';
  }

  handleAddNewMailDomain() {
    this.fakeMail = this.createEmail();
    Log.debug('fake-email::', this.fakeMail);
    if (this.canAddMailDomain) {
      this.config.whitelistEmail = this.config.whitelistEmail.concat([this.newMailDomain.toLowerCase()]);
      this.$v.newMailDomain.$reset();
      this.$v.mailDomain.$reset();
      this.newMailDomain = '';
      TrackingUtils.track(TrackEvents.ChangeMailWhiteList, { mail_domains: this.config.whitelistEmail.join(',') });
    }
  }

  get canAddMailDomain(): boolean {
    this.$v.mailDomain.$touch();
    return !this.$v.mailDomain.$invalid && !this.config.whitelistEmail.includes(this.newMailDomain.toLowerCase());
  }

  createEmail(): string {
    return `test@${this.newMailDomain}`;
  }

  handleRemoveMailDomain(index: number) {
    this.config.whitelistEmail.splice(index, 1);
    TrackingUtils.track(TrackEvents.ChangeMailWhiteList, { mail_domains: this.config.whitelistEmail.join(',') });
  }

  get configName(): string {
    return this.config.name;
  }

  set configName(value: string) {
    this.config.name = value;
  }

  validated(): boolean {
    this.$v.configName.$touch();
    this.$v.clientId.$touch();
    return !this.$v.configName.$invalid && !this.$v.clientId.$invalid;
  }
}
</script>

<template>
  <div class="gg-setting-item">
    <!--    <DiToggle class="w-100" label="Google" :value.sync="config.isActive" label-at="left" is-fill></DiToggle>-->
    <CollapseTransition v-show="true" :delay="5000" easing="ease-in-out">
      <div class="gg-input-area">
        <section>
          <label>Name</label>
          <input
            :id="genInputId('client-name')"
            v-model="config.name"
            autocomplete="off"
            autofocus
            :hide-track-value="true"
            class="form-control mt-0"
            placeholder="Input sso name"
            type="text"
            :class="{ 'input-danger': $v.configName.$error }"
          />
          <div v-if="$v.configName.$error">
            <div v-if="!$v.configName.required" class="text-danger">Name is required.</div>
          </div>
        </section>
        <section>
          <label>Client Id</label>
          <input
            :id="genInputId('client-id')"
            v-model="config.clientIds[0]"
            autocomplete="off"
            :hide-track-value="true"
            class="form-control mt-0"
            placeholder="Client ID"
            type="text"
            :class="{ 'input-danger': $v.clientId.$error }"
          />
          <div v-if="$v.clientId.$error">
            <div v-if="!$v.clientId.required" class="text-danger">Client Id is required.</div>
          </div>
        </section>
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
            v-for="(item, index) in config.whitelistEmail"
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

<style scoped lang="scss"></style>
