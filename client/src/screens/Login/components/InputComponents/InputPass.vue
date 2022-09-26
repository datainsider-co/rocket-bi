<template>
  <div class="form-group password-group">
    <!--    for="InputPassword"-->
    <label>{{ label }}</label>
    <!--      id="InputPassword"-->
    <input
      :id="id"
      :type="type"
      @input="handleValidPassword"
      autocomplete="off"
      class="form-control"
      :class="warningClass()"
      :placeholder="replacePlaceholder"
      :hide-track-value="true"
      ref="input"
      @keydown.enter="handleCatchEnterEvent"
      v-model="$v.password.$model"
    />
    <span class="show-pass">
      <i :class="eyeClass" @click="toggleEye" class="fas"> </i>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { minLength, required } from 'vuelidate/lib/validators';
import { StringUtils } from '@/utils/string.utils';
import { Log } from '@core/utils';

@Component({
  validations: {
    password: {
      required,
      minLength: minLength(6)
    }
  }
})
export default class InputPass extends Vue {
  type = 'password';
  password = '';
  error = false;

  @Prop()
  placeholder?: string;

  @Prop({ default: 'PASSWORD', type: String })
  label!: string;

  @Prop()
  isError!: boolean;

  @Prop({ required: true, type: String })
  id!: string;

  @Ref()
  input?: any;

  get eyeClass(): string {
    if (this.type === 'password') return 'fa-eye-slash';
    else return 'fa-eye';
  }

  get replacePlaceholder() {
    if (this.placeholder) {
      return this.placeholder;
    }
    return 'Your password';
  }

  private warningClass() {
    if (this.isError) {
      return 'warning';
    }
    return '';
  }

  focusInput() {
    this.input?.focus();
  }

  handleValidPassword() {
    this.error = this.$v.password.$invalid;
    this.$emit('onPasswordChanged', this.$v.password.$model, this.error);
  }

  warning() {
    if (!this.$v.password.minLength) {
      return 'danger';
    }
    return '';
  }

  toggleEye() {
    if (this.type === 'password') {
      this.type = 'text';
    } else {
      this.type = 'password';
    }
  }

  private handleCatchEnterEvent(e: Event) {
    this.$emit('enter', e);
  }

  // @Watch('type')
  //   eyeClass1(newVaule:string,oldVaule:string){
  //     if(newVaule ==="text")
  //     {
  //       this.temp='fa-eye';
  //     }
  //     else{
  //       this.temp='fa-eye-slash'
  //     }
  //
}
</script>

<style lang="scss" scoped>
.warning {
  border: 1px solid var(--danger) !important;
}

.password-group {
  display: flex;
  flex-direction: column;
  text-align: right;
  color: var(--text-color);
  opacity: 0.5;
  max-height: 50px;
  margin: 16px;
  position: relative;
}

.password-group > label {
  font-size: 14px;
  text-align: left;
  height: 14px;
  box-sizing: border-box;
  letter-spacing: 0.2px;
  color: var(--secondary-text-color);
}

.password-group > input {
  font-size: 14px;
  padding: 0 40px 0 16px;
  //width: 300px;
  min-height: 42px;
  border-radius: 4px;
  box-sizing: border-box;
  border: solid 1px var(--primary);
  background-color: var(--active-color);
}

.show-pass {
  cursor: pointer;
  position: absolute;
  width: 20px;
  //margin-top: 33px;
  //margin-right: 10px;
  bottom: -3px;
  right: 18px;
}

.password-group:nth-child(2) {
  margin-bottom: 30px;
  //background-color: var(--secondary);
}

.fas {
  opacity: 0.5;
  color: var(--text-color);
}

.danger {
  border-radius: 4px;
  border: solid 1px var(--danger) !important;
  background-color: var(--secondary);
}
@media screen and (max-width: 375px) {
  .password-group > input {
    width: 100%;
  }
}
</style>
