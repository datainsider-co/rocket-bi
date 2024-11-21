<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g fill="none" fill-rule="evenodd">
      <g>
        <g>
          <path d="M0 0H24V24H0z" transform="translate(-56 -204) translate(56 204)" />
          <g :fill="color" fill-rule="nonzero">
            <path
              d="M6 10.5v.92c0 .41.34.75.75.75s.75-.34.75-.75v-.92h9v.92c0 .41.34.75.75.75s.75-.34.75-.75v-.92h6v6.75c0 1.52-1.23 2.75-2.75 2.75H2.75C1.23 20 0 18.77 0 17.25V10.5h6zM14 0c1.103 0 2 .897 2 2v1h5.25c1.464 0 2.658 1.14 2.745 2.582L24 5.75V9h-6V7.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75V9h-9V7.75c0-.41-.34-.75-.75-.75S6 7.34 6 7.75V9H0V5.75C0 4.23 1.23 3 2.75 3H8V2c0-1.103.897-2 2-2h4zm0 2h-4v1h4V2z"
              transform="translate(-56 -204) translate(56 204) translate(0 2)"
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
