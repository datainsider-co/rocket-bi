<template>
  <svg width="17" height="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M.364 0h16v16h-16z" />
      <path
        d="M5.907 13.457a.5.5 0 0 1-.058-.638l.058-.069 4.646-4.646-4.646-4.647a.5.5 0 0 1-.058-.638l.058-.069a.5.5 0 0 1 .637-.058l.07.058 5.353 5.354-5.353 5.353a.5.5 0 0 1-.707 0z"
        :fill="color"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class BreadcrumbIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--directory-header-icon-color)' })
  private readonly color!: string;
}
</script>
