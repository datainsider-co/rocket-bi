<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DIException } from '@core/common/domain';
import { PopupUtils } from '@/utils';
import AssistantSearch from '@/shared/components/AssistantSearch.vue';
import { ChartGenerator } from '@/shared/components/chat/controller/functions/ChartGenerator';

/**
 * Vue component for rendering the header of a chart builder.
 * @extends Vue
 *
 * @prop {boolean} enable - Determines whether the header is enabled or disabled. Defaults to true.
 * @prop {string} actionName - The name of the action button. Defaults to 'Add'.
 *
 * @emits ChartBuilderHeader#cancel - Event emitted when the cancel button is clicked.
 * @emits ChartBuilderHeader#ok - Event emitted when the ok button is clicked.
 */
@Component({
  components: { AssistantSearch, DiButton }
})
export default class ChartBuilderHeader extends Vue {
  @Prop({ required: false, default: true })
  readonly enable!: boolean;

  @Prop({ required: false, default: 'Add' })
  readonly actionName!: string;

  @Emit('cancel')
  handleCancel(event: MouseEvent) {
    return event;
  }

  @Emit('ok')
  handleOk(event: MouseEvent) {
    return event;
  }

  handlePromptChanged(prompt: string) {
    try {
      if (!ChartGenerator.isValid(prompt)) {
        return;
      }

      new ChartGenerator().process(prompt);
      return;
    } catch (error) {
      PopupUtils.showError(DIException.fromObject(error).getPrettyMessage());
    }
  }
}
</script>

<template>
  <header class="d-flex flex-row data-builder-header align-items-center">
    <h3 class="cursor-default unselectable flex-shrink-0">
      Chart Builder
    </h3>
    <AssistantSearch hint-text="Describe your chart..." class="flex-shrink-1" @onEnter="handlePromptChanged" />
    <div class="ml-auto d-flex flex-row align-items-center btn-bar flex-shrink-0">
      <DiButton id="data-builder-cancel" border title="Cancel" @click="handleCancel" />
      <DiButton id="data-builder-submit" primary :title="actionName" @click="handleOk" :disabled="!enable" />
    </div>
  </header>
</template>

<style lang="scss" scoped src="./ChartBuilderController.scss"></style>
