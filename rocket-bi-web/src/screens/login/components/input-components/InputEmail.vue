<template>
  <div class="form-group email-group">
    <label v-if="isRouteLogin">EMAIL</label>
    <label v-else>WORK EMAIL</label>
    <input
      @input="handleValidEmail"
      autocomplete="off"
      class="form-control"
      :class="warningClass()"
      :id="id"
      :placeholder="placeholder ? placeholder : 'email@example.com'"
      type="text"
      v-if="!isRouteLogin"
      v-model.trim="$v.email.$model"
      @keydown.enter="handleCatchEnterEvent"
    />
    <input
      @input="handleValidEmail"
      autocomplete="off"
      class="form-control "
      :class="warningClass()"
      :id="id"
      :placeholder="placeholder ? placeholder : 'Your email'"
      type="text"
      v-else
      v-model.trim="$v.email.$model"
      @keydown.enter="handleCatchEnterEvent"
    />
    <span @click="handleReset" class="email-span">
      <img :style="{ display: btnClass }" src="@/assets/icon/ic_close.svg" />
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { email, minLength, required } from 'vuelidate/lib/validators';
import { Routers } from '@/shared';

@Component({
  validations: {
    email: {
      required,
      email,
      minLength: minLength(1)
    }
  }
})
export default class InputEmail extends Vue {
  email = '';
  error = false;

  @Prop()
  placeholder!: string;

  @Prop()
  isError!: boolean;

  @Prop({ required: true, type: String })
  id!: string;

  private warningClass() {
    if (this.isError) {
      return 'warning';
    } else {
      return '';
    }
  }

  private get btnClass() {
    if (!this.$v.email.required) return 'none';
    return 'inline';
  }

  private get isRouteLogin(): boolean {
    return this.$route.name === Routers.Login;
  }

  handleValidEmail() {
    this.error = this.$v.email.$invalid;
    this.$emit('onEmailChanged', this.$v.email.$model, this.error);
  }

  warning() {
    if (!this.$v.email.email) {
      return 'danger';
    }
    return '';
  }

  handleReset() {
    this.email = '';
    this.$emit('onEmailChanged', this.email);
  }

  private handleCatchEnterEvent(event: KeyboardEvent) {
    this.$emit('enter', event);
  }
}
</script>

<style lang="scss" scoped>
.email-span {
  cursor: pointer;
  width: 20px;
  position: absolute;
  margin-top: 24px;
  margin-left: 250px;
}

img {
  display: none;
}

.email-group {
  display: flex;
  flex-direction: column;
  text-align: left;
  color: var(--text-color);
  opacity: 0.5;
  max-height: 56px;
  margin: 16px;
  margin-bottom: 24px !important;
}

.email-group > label {
  font-size: 12px;
  box-sizing: border-box;
  letter-spacing: 0.2px;
}

.email-group > input {
  font-size: 14px;
  padding: 0px 16px;
  width: 300px;
  min-height: 42px;
  border-radius: 4px;
  box-sizing: border-box;
  border: solid 1px var(--primary);
  background-color: var(--active-color);
}

.danger {
  width: 300px;
  height: 42px;
  border-radius: 4px;
  border: solid 1px var(--danger) !important;
  background-color: var(--secondary);
}
.warning {
  border: solid 1px var(--danger) !important;
}

@media screen and (max-width: 375px) {
  .email-group > input {
    width: 100%;
  }
}
</style>
