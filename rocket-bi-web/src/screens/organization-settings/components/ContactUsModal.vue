<template>
  <DiCustomModal id="contact-us-modal" ref="customModal" ok-title="Submit" size="md" title="Contact Us" @onClickOk="handleClickOk">
    <div class="contact-us-body d-flex flex-column align-items-center">
      <div class="input-box mb-3">
        <div class="title">Work Email*</div>
        <BInput
          :id="genInputId('email')"
          v-model="contactInfo.email"
          autocomplete="off"
          autofocus
          class="form-control"
          :class="{ danger: $v.contactInfo.email.$error, 'border-0': !$v.contactInfo.email.$error }"
          placeholder="thien@datainsider.co"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.contactInfo.email.$error">
          <div v-if="!$v.contactInfo.email.required" class="text-warning">Email is required</div>
          <div v-if="!$v.contactInfo.email.email" class="text-warning">Email is invalid</div>
        </div>
      </div>

      <div class="input-box mb-3">
        <div class="title">Phone*</div>
        <BInput
          :id="genInputId('phone')"
          v-model="contactInfo.phone"
          trim
          autocomplete="off"
          class="form-control"
          :class="{ danger: $v.contactInfo.phone.$error, 'border-0': !$v.contactInfo.phone.$error }"
          placeholder="0123456789"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.contactInfo.phone.$error">
          <div v-if="!$v.contactInfo.phone.required" class="text-warning">Phone is required</div>
        </div>
      </div>
      <div class="input-box mb-3">
        <div class="title">Company Name</div>
        <BInput
          :id="genInputId('company-name')"
          v-model="contactInfo.company_name"
          trim
          autocomplete="off"
          class="form-control"
          placeholder="Data Insider"
          type="text"
          @keydown.enter="handleClickOk"
        />
      </div>
      <div class="d-flex align-items-start w-100">
        <div class="input-box mr-2">
          <div class="title">First Name*</div>
          <BInput
            :id="genInputId('first-name')"
            v-model="contactInfo.first_name"
            trim
            autocomplete="off"
            class="form-control"
            :class="{ danger: $v.contactInfo.first_name.$error, 'border-0': !$v.contactInfo.first_name.$error }"
            placeholder="Thien"
            type="text"
            @keydown.enter="handleClickOk"
          />
          <div v-if="$v.contactInfo.first_name.$error">
            <div v-if="!$v.contactInfo.first_name.required" class="text-warning">First name is required</div>
          </div>
        </div>
        <div class="input-box">
          <div class="title">Last Name*</div>
          <BInput
            :id="genInputId('last-name')"
            v-model="contactInfo.last_name"
            trim
            autocomplete="off"
            class="form-control"
            :class="{ danger: $v.contactInfo.last_name.$error, 'border-0': !$v.contactInfo.last_name.$error }"
            placeholder="Vi"
            type="text"
            @keydown.enter="handleClickOk"
          />
          <div v-if="$v.contactInfo.last_name.$error">
            <div v-if="!$v.contactInfo.last_name.required" class="text-warning">Last name is required</div>
          </div>
        </div>
      </div>

      <div class="">
        <pre v-if="isError" class="error-message">{{ errorMessage }}</pre>
      </div>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { email, required } from 'vuelidate/lib/validators';
import { DIException } from '@core/common/domain/exception';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { OrganizationService } from '@core/organization';
import Swal from 'sweetalert2';

export class ContactInfo {
  constructor(public email: string, public phone: string, public company_name: string, public first_name: string, public last_name: string) {}
  static empty(): ContactInfo {
    return new ContactInfo('', '', '', '', '');
  }
}

@Component({
  components: {
    DiCustomModal
  },
  validations: {
    contactInfo: {
      email: { required, email },
      phone: { required },
      first_name: { required },
      last_name: { required }
    }
  }
})
export default class ContactUsModal extends Vue {
  private contactInfo: ContactInfo = ContactInfo.empty();
  errorMessage = '';
  private status = Status.Loaded;
  private $alert: typeof Swal = Swal;

  @Ref()
  private customModal!: DiCustomModal;

  @Inject
  private orgService!: OrganizationService;

  show() {
    this.customModal.show();
    // this.resetData();
  }

  hide() {
    this.customModal.hide();
    this.$v.$reset();
    this.resetData();
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private isAddNewField(): boolean {
    // TODO: validate here
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private async handleClickOk(event: MouseEvent) {
    try {
      event.preventDefault();
      Log.debug('ContactUsModal::handleClick::click');
      if (this.isAddNewField()) {
        this.customModal.setLoading(true);
        //todo: call api here
        await this.orgService.contactUs(this.contactInfo);
        this.$nextTick(() => {
          this.hide();
        });
        await this.$alert.fire({
          icon: 'success',
          title: 'Submit contact success',
          html: 'Thank you for your interest in our product. We have received your message and will be in touch with you soon to discuss your needs.',
          confirmButtonText: 'OK',
          timer: 3000
        });
      }
    } catch (e) {
      this.handleError(DIException.fromObject(e));
      await this.$alert.fire({
        icon: 'error',
        title: 'Submit contact failed',
        html: e.message,
        confirmButtonText: 'OK'
      });
    }
  }

  handleError(ex: DIException) {
    Log.debug('ContactUs::handleError::error', ex.message);
    this.errorMessage = ex.message;
  }

  private resetData() {
    this.contactInfo = ContactInfo.empty();
    this.errorMessage = '';
    this.$v.$reset();
    this.status = Status.Loaded;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

#contact-us-modal {
  .modal-dialog {
    max-width: 480px;
  }

  .modal-header {
    padding: 22px 22px 0 !important;
  }

  .modal-body {
    padding: 22px;
  }

  .modal-footer {
    padding: 0 18px 18px;
  }
}

.contact-us-body {
  .danger {
    border: 1px solid var(--danger) !important;
  }

  pre {
    white-space: pre-wrap;
  }
  .input-box {
    //padding: 0 24px;
    width: 100%;

    .title {
      @include regular-text;
      font-size: 14px;
      line-height: 14px;
      font-weight: 400;
      padding-bottom: 12px;
    }

    input {
      @include regular-text;
      font-size: 14px;
      font-weight: 300;
      padding: 10px 16px;
      height: 42px;
      cursor: text;
      background: var(--input-background-color);

      &::placeholder {
        @include regular-text;
        font-size: 14px;
        font-weight: 300;
        color: var(--text-color);
        opacity: 0.5;
      }
    }
    .text-warning {
      color: var(--danger) !important;
    }
  }

  .error-message {
    color: var(--danger);
    padding: 10px 24px;
  }
}
</style>
