<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({})
export default class RocketBiLogo extends Vue {}
</script>

<template>
  <div class="logo">
    <img src="@/assets/icon/login/v2/logo.svg" />
    <h3 class="logo--name unselectable">RocketBI</h3>
  </div>
</template>

<style lang="scss">
.logo {
  display: flex;
  flex-direction: row;
  &--name {
    margin-left: 1rem;
    font-style: normal;
    font-weight: 600;
    font-size: 36px;
    line-height: 42px;
    margin-bottom: 0;
    align-items: center;
    color: var(--white);
  }
}
</style>
