<template>
  <svg class="data-text-icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <circle cx="8" cy="8" fill="var(--icon-background-color)" r="8" />
      <path
        d="m4.665 4.204.08-.004h6.922c.269 0 .495.201.528.465l.005.08v.916a.532.532 0 0 1-1.062.067l-.004-.08-.001-.383-2.402-.001v5.9l.954.001a.532.532 0 0 1 .068 1.061l-.08.005h-2.96a.532.532 0 0 1-.066-1.062l.08-.004h.94V5.263l-2.402.001v.396c0 .27-.201.495-.465.528l-.08.005a.53.53 0 0 1-.516-.466l-.004-.08v-.916c0-.269.201-.495.465-.528z"
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
export default class DataTextIcon extends Vue {}
</script>

<style lang="scss">
.light .data-text-icon {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}
.dark .data-text-icon {
  --icon-background-color: #757c83;
  --icon-color: #fff;
}
</style>
