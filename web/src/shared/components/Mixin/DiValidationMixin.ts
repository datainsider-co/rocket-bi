import { Component, Vue } from 'vue-property-decorator';
import { Validation } from 'vuelidate';

@Component
export default class DiValidationMixin extends Vue {
  private readonly touchMap = new WeakMap();

  delayValidate($v: Validation, time = 500) {
    $v.$reset();
    if (this.touchMap.has($v)) {
      clearTimeout(this.touchMap.get($v));
    }
    this.touchMap.set($v, setTimeout($v.$touch, time));
  }
}
