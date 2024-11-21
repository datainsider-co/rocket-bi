<template>
  <svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M8 8V0H0v8z" />
      <path
        d="M1.18 2.208a.709.709 0 0 0-.96-.04.614.614 0 0 0-.104.83l.063.074L4 7l3.821-3.928a.614.614 0 0 0-.041-.904.711.711 0 0 0-.887-.026l-.073.066L4 5.106 1.18 2.208z"
        fill-rule="nonzero"
        :fill="color"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class CaretDownIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
