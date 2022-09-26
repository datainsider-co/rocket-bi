<template>
  <SuggestionInput :placeholder="placeholder" :init-value="value" :suggestionTexts="suggestionTexts" @onChange="onInputChange" @onFocus="handleFocus" />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import SuggestionInput from '@/screens/DataIngestion/components/SuggestionInput.vue';
import { SuggestionCommand } from '@/screens/DataIngestion/interfaces/SuggestionCommand';
import { Log } from '@core/utils';

@Component({
  components: { SuggestionInput }
})
export default class DynamicSuggestionInput extends Vue {
  private suggestionTexts: string[] = [];
  @Prop()
  suggestionCommand!: SuggestionCommand;

  @Prop({ required: true, type: String })
  placeholder!: string;

  @Prop({ default: '', type: String })
  value!: string;

  async handleFocus() {
    try {
      this.suggestionTexts = await this.suggestionCommand.load();
    } catch (e) {
      Log.error('DynamicSuggestionInput::handleFocus::error::', e.message);
    }
  }

  onInputChange(newValue: string) {
    this.$emit('change', newValue);
  }
}
</script>

<style lang="scss"></style>
