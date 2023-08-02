<template>
  <svg class="data-number-icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <circle cx="8" cy="8" fill="var(--icon-background-color)" r="8" />
      <path d="M10.237 12v-.978H9.201V4H7v.957h1.1v6.065H7V12z" fill="var(--icon-color)" fill-rule="nonzero" />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class DataNumberIcon extends Vue {}
</script>

<style lang="scss">
.light .data-number-icon {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}
.dark .data-number-icon {
  --icon-background-color: #757c83;
  --icon-color: #fff;
}
</style>
