<template>
  <svg class="add-user" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <circle fill="var(--icon-background-color)" cx="16" cy="16" r="16" />
      <path
        d="M16 6a4.787 4.787 0 0 1 4.781 4.781 4.777 4.777 0 0 1-1.917 3.826c.36.119.712.26 1.058.425a.703.703 0 1 1-.603 1.27 7.659 7.659 0 0 0-3.13-.743 4.848 4.848 0 0 1-.375 0c-3.57.086-6.662 2.647-7.392 6.151a.735.735 0 0 0 .15.616c.08.1.262.268.562.268h8.659a.703.703 0 1 1 0 1.406h-8.66a2.135 2.135 0 0 1-2.088-2.576 9.173 9.173 0 0 1 3.148-5.194 9.137 9.137 0 0 1 2.946-1.62 4.777 4.777 0 0 1-1.92-3.829A4.787 4.787 0 0 1 16 6zm5.66 11.32c.388 0 .703.315.703.703v1.934h1.934a.703.703 0 1 1 0 1.406h-1.934v1.934a.703.703 0 1 1-1.406 0v-1.934h-1.934a.703.703 0 1 1 0-1.406h1.934v-1.934c0-.388.315-.703.703-.703zM16 7.406a3.379 3.379 0 0 0-3.375 3.375 3.38 3.38 0 0 0 3.205 3.371l.17-.002h.086l.085.002a3.38 3.38 0 0 0 3.204-3.37A3.379 3.379 0 0 0 16 7.405z"
        fill="var(--icon-color)"
        fill-rule="nonzero"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';

@Component
export default class AddUserIcon extends Vue {}
</script>

<style lang="scss">
svg.add-user[active] {
  --icon-background-color: var(--accent);
  --icon-color: var(--accent-text-color);
}

svg.add-user[deactive] {
  --icon-background-color: #f2f2f7;
  --icon-color: #959595;
}
</style>
