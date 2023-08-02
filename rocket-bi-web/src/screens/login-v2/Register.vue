<template>
  <b-row class="oath-page">
    <RegisterPanel class="form-panel" />
    <LoginDecoPanel id="decor-panel" />
  </b-row>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import LoginDecoPanel from '@/screens/login-v2/components/login/LoginDecoPanel.vue';
import RegisterPanel from '@/screens/login-v2/components/register/RegisterPanel.vue';

@Component({
  components: { LoginDecoPanel, RegisterPanel }
})
export default class Register extends Vue {}
</script>

<style lang="scss" src="./login-v2.scss" />
