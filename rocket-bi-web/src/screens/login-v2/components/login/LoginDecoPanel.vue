<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import RocketBiLogo from '@/screens/login-v2/components/RocketBiLogo.vue';

@Component({
  components: { RocketBiLogo }
})
export default class LoginDecoPanel extends Vue {}
</script>

<template>
  <div>
    <img src="@/assets/icon/login/v2/login.svg" id="background" alt="" />
    <RocketBiLogo id="logo" />
  </div>
</template>
