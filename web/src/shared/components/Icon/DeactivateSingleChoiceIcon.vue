<template>
  <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <g :fill="color" fill-rule="nonzero">
        <g>
          <g>
            <path
              d="M8 0c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
              transform="translate(-714 -274) translate(496 257) translate(218 17)"
            />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DeactivateSingleChoiceIcon extends Vue {
  @Prop({ required: false, type: String, default: '#9799AC' })
  private readonly color!: string;
}
</script>
