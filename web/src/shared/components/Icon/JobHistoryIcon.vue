<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g fill="none" fill-rule="evenodd">
      <g>
        <g>
          <path d="M0 0H24V24H0z" transform="translate(-56 -260) translate(56 260)" />
          <g :fill="color" fill-rule="nonzero">
            <path
              d="M19 0c.55 0 1 .45 1 1v3h1c.04 0 .08.02.13.03.04-.01.08-.03.12-.03.41 0 .75.34.75.75v18.5c0 .41-.34.75-.75.75H2.75C1.23 24 0 22.77 0 21.25V2.75c0-.09.02-.17.05-.25C.29 1.08 1.52 0 3 0zm-7.5 7.5C7.92 7.5 5 10.42 5 14s2.92 6.5 6.5 6.5S18 17.58 18 14s-2.92-6.5-6.5-6.5zm0 2.5c.552 0 1 .447 1 1v2.586l1.207 1.207c.391.391.391 1.023 0 1.414-.195.195-.451.293-.707.293-.256 0-.512-.098-.707-.293l-1.5-1.5c-.188-.187-.293-.441-.293-.707v-3c0-.553.448-1 1-1zM18 2H4c-.55 0-1 .45-1 1s.45 1 1 1h14V2z"
              transform="translate(-56 -260) translate(56 260) translate(1)"
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
export default class JobHistory extends Vue {
  @Prop({ required: false, type: String, default: 'var(--icon-color)' })
  private readonly color!: string;
}
</script>
