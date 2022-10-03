<template>
  <svg class="share-link" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <circle fill="var(--icon-background-color)" cx="16" cy="16" r="16" />
      <path
        d="M14.99 10.947v1.92h-4.043A3.135 3.135 0 0 0 7.815 16a3.135 3.135 0 0 0 3.132 3.133h4.042v1.92h-4.042A5.054 5.054 0 0 1 5.895 16a5.054 5.054 0 0 1 5.052-5.053h4.042zm6.063 0A5.054 5.054 0 0 1 26.105 16a5.054 5.054 0 0 1-5.052 5.053H17.01v-1.92h4.042A3.135 3.135 0 0 0 24.185 16a3.135 3.135 0 0 0-3.132-3.133H17.01v-1.92zm-1.01 4.042v2.022h-8.085v-2.022h8.084z"
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
export default class LinkIcon extends Vue {}
</script>

<style lang="scss">
svg.share-link[active] {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}

svg.share-link[deactive] {
  --icon-background-color: #f2f2f7;
  --icon-color: #959595;
}
</style>
