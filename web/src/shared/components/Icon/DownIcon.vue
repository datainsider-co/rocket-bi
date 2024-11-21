<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0H16V16H0z" />
      <path :stroke="color" stroke-linecap="round" d="M3 6L8 11 13 6" />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class DownIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
