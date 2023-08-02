<template>
  <div :style="{ width: width }" class="text-widget-container overflow-hidden">
    <div :style="widget.getContainerStyle()" class="text-widget-container--background"></div>
    <StatusWidget class="text-widget-container--status-widget" :status="status" :error="errorMessage" hide-retry>
      <div
        ref="htmlRender"
        :style="{ ...widget.getRenderStyle() }"
        class="html-render"
        v-if="widget.isHtmlRender"
        v-html="currentWidget.content"
        key="html-rendering"
      />
      <BFormTextarea
        :readonly="!isEdit"
        ref="textRender"
        no-resize
        class="text-render"
        :spellcheck="false"
        v-else
        max-rows="1000"
        rows="0"
        key="normal-rendering"
        :style="{ ...widget.getRenderStyle() }"
        v-model="currentWidget.content"
        @change="showNotifyUpdateWidgetContent"
      >
      </BFormTextarea>
    </StatusWidget>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { TextWidget } from '@core/common/domain/model';
import { Log } from '@core/utils';
import { WidgetModule } from '@/screens/dashboard-detail/stores';
import { BFormTextarea } from 'bootstrap-vue';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import Swal from 'sweetalert2';
import { cloneDeep } from 'lodash';

@Component({
  components: {
    StatusWidget
  }
})
class TextViewer extends Vue {
  $alert!: typeof Swal;
  status: Status = Status.Loaded;
  errorMessage = '';

  @Prop()
  widget!: TextWidget;

  @Prop({ type: Boolean, default: false })
  isEdit!: boolean;

  @Prop({ type: String, required: false, default: '100%' })
  width!: string;

  @Ref()
  textRender?: BFormTextarea;

  @Ref()
  htmlRender?: HTMLElement;

  currentWidget = cloneDeep(this.widget);

  @Watch('widget')
  onWidgetChanged(widget: TextWidget) {
    this.currentWidget = cloneDeep(this.widget);
  }

  @Watch('widget.content')
  onWidgetContentChanged(text: string) {
    this.currentWidget.content = text;
  }

  private async showNotifyUpdateWidgetContent(content: string) {
    if (content !== this.widget.content) {
      const { isConfirmed } = await this.$alert.fire({
        icon: 'warning',
        title: 'Please Confirm',
        html: 'Are you sure you want to update the content of this widget?',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No'
      });
      if (isConfirmed) {
        await this.handleContentChange(content);
      } else {
        this.currentWidget.content = this.widget.content;
      }
    }
  }

  //todo: handleUpdateText onBlur
  private async handleContentChange(content: string) {
    try {
      Log.debug('TextViewer::handleContentChange::content;:', content);
      this.status = Status.Updating;
      await WidgetModule.handleUpdateWidget(this.currentWidget);
      WidgetModule.addWidget({ widget: this.currentWidget, position: WidgetModule.getPosition(this.currentWidget.id) });
      this.status = Status.Loaded;
    } catch (e) {
      this.status = Status.Error;
      this.errorMessage = e.message;
    }
  }
}

export default TextViewer;
</script>

<style lang="scss">
.text-widget-container {
  position: relative;
  background: transparent;

  &--background {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  &--status-widget {
    display: flex;
    align-items: flex-start;
    z-index: 0;
    background: transparent;
  }

  .html-render {
    //padding: 16px 16px 16px 16px;
  }

  .text-render {
    overflow: hidden;
    padding: 16px;
    background: transparent;
  }
}
</style>
