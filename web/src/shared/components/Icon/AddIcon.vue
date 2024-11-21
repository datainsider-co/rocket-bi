<template>
  <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.667 6.667H9.333V1.333a1.333 1.333 0 1 0-2.666 0v5.334H1.333a1.333 1.333 0 1 0 0 2.666h5.334v5.334a1.333 1.333 0 0 0 2.666 0V9.333h5.334a1.333 1.333 0 0 0 0-2.666z"
      :fill="color"
      fill-rule="nonzero"
    />
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class AddIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
