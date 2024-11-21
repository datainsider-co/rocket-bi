<template>
  <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" class="function-icon">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <circle fill="var(--icon-background-color)" cx="8" cy="8" r="8" />
      <path
        d="M9 3c1.103 0 2 .897 2 2h-1a1.001 1.001 0 0 0-2 0v1.5h1.25v1H8v3.25c0 1.103-.897 2-2 2s-2-.897-2-2h1a1.001 1.001 0 0 0 2 0V7.5H5.75v-1H7V5c0-1.103.897-2 2-2zm2.927 6.823a.25.25 0 0 1 0 .354l-.824.823.824.823a.25.25 0 1 1-.354.354l-.823-.824-.823.824a.25.25 0 0 1-.354 0 .25.25 0 0 1 0-.354l.824-.823-.824-.823a.25.25 0 1 1 .354-.354l.823.824.823-.824a.25.25 0 0 1 .354 0z"
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
export default class FunctionDateIcon extends Vue {}
</script>

<style lang="scss">
.light .function-icon {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}

.dark .function-icon {
  --icon-background-color: #757c83;
  --icon-color: #fff;
}
</style>
