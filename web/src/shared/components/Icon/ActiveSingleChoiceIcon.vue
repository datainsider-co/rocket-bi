<template>
  <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <g :fill="color">
        <g>
          <g transform="translate(-629 -274) translate(496 257) translate(133 17)">
            <path
              d="M8 0c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
              fill-rule="nonzero"
            />
            <circle cx="8" cy="8" r="4" />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ActiveSingleChoiceIcon extends Vue {
  @Prop({ required: false, type: String, default: '#57F' })
  private readonly color!: string;
}
</script>
