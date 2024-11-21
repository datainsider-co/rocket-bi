<template>
  <div class="custom-spinner fa fa-spin">
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.50065 3.23801C5.87072 3.23801 3.73875 5.36999 3.73875 7.99992C3.73875 8.5259 3.31235 8.9523 2.78637 8.9523C2.26038 8.9523 1.83398 8.5259 1.83398 7.99992C1.83398 4.31802 4.81875 1.33325 8.50065 1.33325C12.1826 1.33325 15.1673 4.31802 15.1673 7.99992C15.1673 11.6818 12.1826 14.6666 8.50065 14.6666C7.97467 14.6666 7.54827 14.2402 7.54827 13.7142C7.54827 13.1882 7.97467 12.7618 8.50065 12.7618C11.1306 12.7618 13.2626 10.6298 13.2626 7.99992C13.2626 5.36999 11.1306 3.23801 8.50065 3.23801Z"
        fill="#4F4F4F"
      />
    </svg>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Ref } from 'vue-property-decorator';
@Component
export default class Spinner extends Vue {}
</script>

<style lang="scss">
.custom-spinner {
  width: fit-content;
}
</style>
