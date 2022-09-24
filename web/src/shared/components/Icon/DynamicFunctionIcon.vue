<template>
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <circle fill="#597FFF" cx="8" cy="8" r="8" />
      <path d="M2 2h12v12H2z" />
      <path
        d="M3.5 10.5v1h3v-1h-3zm0-6v1h5v-1h-5zm5 8v-1h4v-1h-4v-1h-1v3h1zm-3-6v1h-2v1h2v1h1v-3h-1zm7 2v-1h-5v1h5zm-3-2h1v-1h2v-1h-2v-1h-1v3z"
        fill="#FFF"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class DynamicFunctionIcon extends Vue {}
</script>
<style lang="scss">
.light .data-date-icon {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}
.dark .data-date-icon {
  --icon-background-color: #757c83;
  --icon-color: #fff;
}
</style>
