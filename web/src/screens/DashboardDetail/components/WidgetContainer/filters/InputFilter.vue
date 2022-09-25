<template>
  <SearchInput hintText="Type here to filter by keyword" @text-changed="handleTextChange">
    <i class="di-icon-edit ic-16"></i>
  </SearchInput>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class InputFilter extends Vue {
  @Prop({ required: true })
  // filter!: InputValueFilter;
  //
  // currentFilter = InputValueFilter.empty();
  mounted() {
    // if (this.filter) this.currentFilter = Object.assign(this.currentFilter, this.filter);
  }

  handleTextChange(text: string) {
    // this.currentFilter.setValue(text);
    // this.$parent.$emit('change', this.currentFilter);
  }
}
</script>
