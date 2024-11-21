<template>
  <svg class="data-date-icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <circle cx="8" cy="8" fill="var(--icon-background-color)" r="8" />
      <path
        d="M11.5 5h-1V4h-1v1h-1V4h-1v1h-1V4h-1v1h-1a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5zm-.5 6H5V7h6v4z"
        fill="var(--icon-color)"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class DataDateIcon extends Vue {}
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
