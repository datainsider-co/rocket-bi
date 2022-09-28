<template>
  <div>
    <div v-if="widget.isHtmlRender" v-html="widget.content" />
    <div
      v-else
      :style="{
        color: widget.textColor,
        fontSize: widget.fontSize
      }"
    >
      {{ widget.content }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextWidget } from '@core/domain/Model';

@Component
class TextViewer extends Vue {
  @Prop()
  widget!: TextWidget;
}

export default TextViewer;
</script>
