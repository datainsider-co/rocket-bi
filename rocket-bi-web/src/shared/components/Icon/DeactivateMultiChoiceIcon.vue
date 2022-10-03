<template>
  <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <g :fill="color" fill-rule="nonzero">
        <g>
          <g>
            <path
              d="M14.125 16H1.875C.841 16 0 15.159 0 14.125V1.875C0 .841.841 0 1.875 0h12.25C15.159 0 16 .841
              16 1.875v12.25C16 15.159 15.159 16 14.125 16zM1.875 1.25c-.345 0-.625.28-.625.625v12.25c0 .345.28.625.625.625h12.25c.345 0 .625-.28.625-.625V1.875c0-.345-.28-.625-.625-.625H1.875z"
              transform="translate(-790 -209) translate(496 192) translate(294 17)"
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
export default class DeactivateMultiChoiceIcon extends Vue {
  @Prop({ required: false, type: String, default: '#9799AC' })
  private readonly color!: string;
}
</script>
