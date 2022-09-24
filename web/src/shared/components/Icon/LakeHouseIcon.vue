<template>
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M0 0h16v16H0z" />
      <path
        :fill="color"
        d="M13.98 9.962v2.986c0 1.468-2.797 2.657-6.246 2.657-3.447 0-6.242-1.19-6.242-2.657V9.962c.356.615 1.16 1.634 2.569 1.51 1.845-.163 2.3.903 3.673.903 1.498 0 1.906-.786 3.266-.786 2.116 0 2.584-.942 2.98-1.627zm0-3.345v1.58c0 .753-.738 2.136-2.38 2.136-1.64 0-2.184.9-3.864.9-1.391 0-2.102-1.12-3.716-.9-1.832.25-2.528-1.26-2.528-2.136v-1.58c.07.614.832 1.59 2.514 1.585 1.273-.005 1.324.889 3.73.889 2.217 0 1.674-.605 3.298-.788 1.79-.202 2.87-1.01 2.946-1.686zm-.17-3.928c.107.196.17.4.17.61v1.666c0 .753-.581 1.968-2.38 2.136C9.804 7.269 9.417 8 7.737 8c-1.391 0-1.743-.9-3.716-.9-1.924 0-2.528-1.26-2.528-2.135V3.298c0-.21.062-.413.17-.608.121 1.074 2.79 1.935 6.072 1.935 3.285 0 5.953-.86 6.076-1.936zM7.734 0c3.362 0 6.086.9 6.086 2.01 0 1.112-2.724 2.012-6.086 2.012-3.36 0-6.084-.9-6.084-2.01C1.65.9 4.375 0 7.734 0z"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

@Component
export default class LakeHouseIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
