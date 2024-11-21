<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <g fill="none" fill-rule="evenodd">
      <g>
        <g>
          <g>
            <path d="M0 0H16V16H0z" transform="translate(-1076 -13) translate(1076 12) translate(0 1)" />
            <g :fill="color" fill-rule="nonzero">
              <path
                d="M.678 10.412c.67 1.158 3.126 2.02 6.056 2.02 2.934 0 5.387-.862 6.057-2.02.12.203.19.415.19.635v1.9c0 1.469-2.798 2.658-6.247 2.658-3.447 0-6.242-1.19-6.242-2.657v-1.901c0-.22.069-.432.186-.635zm12.113-3.925c.12.205.19.417.19.637v1.9c0 1.467-2.798 2.657-6.247 2.657-3.447 0-6.242-1.19-6.242-2.658V7.124c0-.22.069-.432.186-.637.67 1.161 3.126 2.022 6.056 2.022 2.934 0 5.387-.862 6.057-2.022zm.019-3.798c.107.196.17.4.17.61v1.898c0 1.469-2.797 2.658-6.246 2.658-3.447 0-6.242-1.19-6.242-2.658V3.298c0-.21.062-.413.17-.608.121 1.074 2.79 1.935 6.072 1.935 3.285 0 5.953-.86 6.076-1.936zM6.734 0c3.362 0 6.086.9 6.086 2.01 0 1.112-2.724 2.012-6.086 2.012-3.36 0-6.084-.9-6.084-2.01C.65.9 3.375 0 6.734 0z"
                transform="translate(-1076 -13) translate(1076 12) translate(0 1) translate(1)"
              />
            </g>
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
export default class DataWarehouseIcon extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
