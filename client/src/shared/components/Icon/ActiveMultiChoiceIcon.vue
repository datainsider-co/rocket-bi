<template>
  <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <g fill-rule="nonzero">
        <g>
          <g>
            <path
              :fill="color"
              d="M14.125 16H1.875C.841 16 0 15.159 0 14.125V1.875C0 .841.841 0 1.875 0h12.25C15.159 0 16 .841 16 1.875v12.25C16 15.159 15.159 16 14.125 16z"
              transform="translate(-629 -209) translate(496 192) translate(133 17)"
            />
            <path
              :fill="iconColor"
              d="M13.466 4.729L12.534 3.896 6.754 10.351 3.399 7.162 2.538 8.068 6.826 12.144z"
              transform="translate(-629 -209) translate(496 192) translate(133 17)"
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
export default class ActiveMultiChoiceIcon extends Vue {
  @Prop({ required: false, type: String, default: '#57F' })
  private readonly color!: string;

  @Prop({ required: false, type: String, default: '#FFF' })
  private readonly iconColor!: string;
}
</script>
