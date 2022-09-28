<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0H15.602V16H0z" />
      <rect width="11.702" height="1" x="1.95" y="6" :fill="color" rx=".5" />
      <rect width="11.702" height="1" x="1.95" y="9" :fill="color" rx=".5" />
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DragIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
