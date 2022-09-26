<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18">
    <g fill="none" fill-rule="evenodd">
      <g>
        <g>
          <g>
            <path d="M0 0H16V16H0z" transform="translate(-32.000000, -97.000000) translate(32.000000, 92.000000) translate(0.000000, 6.000000)" />
            <path
              :stroke="color"
              stroke-linecap="round"
              stroke-width="1.5"
              d="M0.667 4L8 12 15.333 4"
              transform="translate(-32.000000, -97.000000) translate(32.000000, 92.000000) translate(0.000000, 6.000000) translate(8.000000, 8.000000) rotate(-270.000000) translate(-8.000000, -8.000000)"
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class JobIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
