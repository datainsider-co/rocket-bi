<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <g fill="none" fill-rule="evenodd">
      <g>
        <g>
          <g>
            <path d="M0 0H16V16H0z" transform="translate(-585 -13) translate(585 12) translate(0 1)" />
            <path
              :fill="color"
              fill-rule="nonzero"
              d="M6.167 5.333c.643 0 1.166.524 1.166 1.167v8.333c0 .644-.523 1.167-1.166 1.167h-5C.523 16 0 15.477 0 14.833V6.5c0-.643.523-1.167 1.167-1.167zm8.666 6c.644 0 1.167.524 1.167 1.167v2.333c0 .644-.523 1.167-1.167 1.167h-5c-.643 0-1.166-.523-1.166-1.167V12.5c0-.643.523-1.167 1.166-1.167zm0-6c.644 0 1.167.524 1.167 1.167v2.333C16 9.477 15.477 10 14.833 10h-5c-.643 0-1.166-.523-1.166-1.167V6.5c0-.643.523-1.167 1.166-1.167zm0-5.333C15.477 0 16 .523 16 1.167v1.666C16 3.477 15.477 4 14.833 4H1.167C.523 4 0 3.477 0 2.833V1.167C0 .523.523 0 1.167 0z"
              transform="translate(-585 -13) translate(585 12) translate(0 1)"
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
export default class DashboardSettingIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
