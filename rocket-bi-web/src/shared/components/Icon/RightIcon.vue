<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="46" height="48" viewBox="0 0 46 48">
    <defs>
      <filter id="grxpt9zvca" width="111.6%" height="114.8%" x="-5.8%" y="-6.9%" filterUnits="objectBoundingBox">
        <feOffset dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="4" />
        <feColorMatrix in="shadowBlurOuter1" result="shadowMatrixOuter1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g fill="none" fill-rule="evenodd" filter="url(#grxpt9zvca)" transform="translate(-435 -64)">
      <g>
        <path d="M0 0H16V16H0z" transform="matrix(-1 0 0 1 466 80)" />
        <path :stroke="color" stroke-linecap="round" stroke-width="1.5" d="M0.667 4L8 12 15.333 4" transform="matrix(-1 0 0 1 466 80) rotate(90 8 8)" />
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class RightIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
