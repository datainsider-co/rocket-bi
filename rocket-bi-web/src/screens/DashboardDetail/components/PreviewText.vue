<template>
  <div class="container-fluid px-0 preview-text-panel">
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label for="inputText">Text</label>
          <input
            placeholder="Input your title"
            type="text"
            class="form-control"
            id="inputText"
            autocomplete="off"
            v-model="textWidget.content"
            autofocus
            v-on:keyup.enter="submit"
          />
        </div>
        <div class="form-row">
          <div class="col form-group">
            <label for="inputText">Font size</label>
            <!--            <CustomSelect :options="options" @change="handleFilterChanged" :selected="selected" />-->
            <DiDropdown
              :id="genDropdownId('add-text-font-size')"
              labelProps="displayName"
              valueProps="data"
              :value="selected.data"
              :data="options"
              @selected="handleFilterChanged"
            />
          </div>
          <template>
            <div class="col form-group">
              <label for="textColor">Text color</label>
              <div class="input-group" id="textColor">
                <ColorPicker :id="genBtnId('preview-text-color-picker')" :value="textWidget.textColor" @change="handlePickColor" />
              </div>
            </div>
          </template>
        </div>
        <div class="custom-control custom-control-right custom-switch">
          <input v-model="textWidget.isHtmlRender" type="checkbox" class="custom-control-input" id="switch-markdown" />
          <label class="custom-control-label" for="switch-markdown">Use markdown rendering</label>
        </div>
        <span class="note">
          Markdown text is not displayed in the PDF if the dashboard is downloaded. This is because Markdown is rendered in your browser, and our PDF downloads
          are generated on our server and will not render the Markdown text.
        </span>
      </div>
      <div class="m-1" />
      <div class="col visualize-form form-group">
        <label for="visualize">Visualize</label>
        <div id="visualize">
          <transition name="fade" mode="out-in">
            <p v-if="textWidget.isHtmlRender" v-html="textWidget.content" key="html-rendering" />
            <p
              v-else
              key="normal-rendering"
              :style="{
                color: textWidget.textColor,
                fontSize: textWidget.fontSize
              }"
            >
              {{ textWidget.content }}
            </p>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import { TextWidget } from '@core/domain/Model';
import { SelectOption } from '@/shared';
import { clone } from 'lodash';
import { StringUtils } from '@/utils/string.utils';
import { Log } from '@core/utils';

@Component
class PreviewText extends Vue {
  @Prop({})
  widget!: TextWidget;

  textWidget = TextWidget.empty();

  readonly options: SelectOption[] = [
    {
      id: 'header',
      displayName: 'Header',
      data: '24px'
    },
    {
      id: 'normal',
      displayName: 'Normal',
      data: '16px'
    },
    {
      id: '8px',
      displayName: '8px',
      data: '8px'
    },
    {
      id: '9px',
      displayName: '9px',
      data: '9px'
    },
    {
      id: '10px',
      displayName: '10px',
      data: '10px'
    },
    {
      id: '11px',
      displayName: '11px',
      data: '11px'
    },
    {
      id: '12px',
      displayName: '12px',
      data: '12px'
    },
    {
      id: '14px',
      displayName: '14px',
      data: '14px'
    },
    {
      id: '16px',
      displayName: '16px',
      data: '16px'
    },
    {
      id: '18px',
      displayName: '18px',
      data: '18px'
    },
    {
      id: '20px',
      displayName: '20px',
      data: '20px'
    },
    {
      id: '24px',
      displayName: '24px',
      data: '24px'
    },
    {
      id: '28px',
      displayName: '28px',
      data: '28px'
    },
    {
      id: '36px',
      displayName: '36px',
      data: '36px'
    },
    {
      id: '48px',
      displayName: '48px',
      data: '48px'
    }
  ];

  created() {
    if (this.widget) {
      this.textWidget = clone(this.widget);
    } else {
      this.textWidget = TextWidget.empty();
    }
  }

  handleFilterChanged(option: SelectOption) {
    this.textWidget.fontSize = option.data;
  }

  handlePickColor(newColor: string) {
    this.textWidget.textColor = newColor;
  }

  /**
   * Warning: watch **textWidget** [object] is a bad solution
   * But it is the fastest way to complete the job
   **/
  @Watch('textWidget', { deep: true })
  textWidgetChanged(newData: TextWidget) {
    this.$emit('change', newData);
  }

  get selected() {
    if (this.widget) {
      const item = this.options.find(option => option.data === this.widget.fontSize);
      return item || this.options[0].data;
    } else {
      return this.options[0].data;
    }
  }

  @Emit('submit')
  submit() {
    Log.debug('submit data', this.textWidget);
  }
}

export default PreviewText;
</script>

<style lang="scss" scoped>
::v-deep {
  @import '~@/themes/scss/di-variables.scss';
  @import '~@/themes/scss/mixin.scss';

  .preview-text-panel {
    min-height: 241px;
  }

  .input-form,
  .visualize-form {
    text-indent: 0;
    flex-grow: 1;
  }

  #visualize {
    height: calc(100% - 16px);
    background-color: var(--input-background-color);
    border-radius: 4px;
    padding: 15px;

    p {
      word-break: break-word;
    }
  }

  div > label {
    @include regular-text();
    opacity: 0.5;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }

  .form-control {
    padding: 0 15px;
    font-size: 14px;
    letter-spacing: 0.2px;
    min-height: 42px;

    &:focus {
      outline: none;
      -webkit-box-shadow: none;
      caret-color: var(--text-color);
    }
  }

  div {
    .custom-control-right {
      padding-right: 24px;
      padding-left: 0;
      margin-left: 0;
      margin-right: 15px;
    }

    .custom-control-label {
      text-transform: unset;
      color: $primary-text-color;
      opacity: 1;
      width: 100%;
      line-height: 1.5;
      cursor: pointer;
    }

    .custom-control-right .custom-control-label::after {
      right: -1.5rem;
      left: auto;
    }

    .custom-control-right .custom-control-label::before {
      right: -2.35rem;
      left: auto;
    }
  }

  span[class='note'] {
    font-size: 14px;
    line-height: 1.4;
    letter-spacing: 0.2px;
    opacity: 0.5;
  }

  .modal-header {
    padding-bottom: 0;
  }

  .input-group {
    .btn-color-picker {
      background-color: var(--input-background-color);
    }
  }

  .select-container {
    margin-top: 0;
  }
}
</style>
