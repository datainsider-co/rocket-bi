<template>
  <div>
    <h1>404</h1>
    <h3>The {{ resource }} you're looking for is not here.</h3>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    resource: {
      type: String,
      required: false,
      default: ''
    }
  }
});
</script>
