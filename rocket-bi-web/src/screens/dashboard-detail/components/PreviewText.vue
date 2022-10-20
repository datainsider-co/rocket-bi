<template>
  <div class="container-fluid px-0">
    <div class="preview-text-panel">
      <div class="preview-text-panel-left">
        <div class="mode-selector">
          <DiButton
            :primary="!textWidget.isHtmlRender"
            :class="{ 'normal-button': textWidget.isHtmlRender }"
            class="mr-1"
            title="Text"
            @click="handleEditorModeChange(false)"
          >
            <i class="di-icon-text"></i>
          </DiButton>
          <DiButton
            :primary="textWidget.isHtmlRender"
            :class="{ 'normal-button': !textWidget.isHtmlRender }"
            class="mr-1"
            title="HTML"
            @click="handleEditorModeChange(true)"
          >
            <i class="di-icon-code"></i>
          </DiButton>
        </div>
        <BFormTextarea
          :placeholder="editorPlaceholder"
          type="text"
          class="text-editor form-control"
          id="inputText"
          autocomplete="off"
          v-model="textWidget.content"
          autofocus
        />
        <div class="editor-config">
          <template v-if="!textWidget.isHtmlRender">
            <div class="config-item">
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
            <div class="config-item">
              <label>Text color</label>
              <div class="input-group">
                <ColorSetting :id="genBtnId('preview-text-color-picker')" default-color="#fff" :value="textWidget.textColor" @onChanged="handlePickColor" />
              </div>
            </div>
          </template>

          <div class="config-item">
            <label>Background</label>
            <div class="input-group">
              <ColorSetting
                :id="genBtnId('preview-text-color-picker')"
                default-color="#fff"
                :value="textWidget.backgroundColor"
                @onChanged="handleBackgroundColorChanged"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="preview-text-panel-separate" />
      <div class="preview-text-panel-right">
        <label for="visualize">VISUALIZE</label>
        <div
          id="visualize"
          :style="{
            background: textWidget.backgroundColor
          }"
        >
          <transition name="fade" mode="out-in">
            <p v-if="textWidget.isHtmlRender" v-html="textWidget.content" key="html-rendering" />
            <p
              v-else
              class="h-100"
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
import { TextWidget } from '@core/common/domain/model';
import { SelectOption } from '@/shared';
import { clone } from 'lodash';
import { Log } from '@core/utils';
import ColorSetting from '@/shared/settings/common/ColorSetting.vue';

@Component({
  components: {
    ColorSetting
  }
})
class PreviewText extends Vue {
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

  private get editorPlaceholder() {
    return this.textWidget.isHtmlRender ? 'Input code...' : 'Input text...';
  }

  init(textWidget: TextWidget) {
    this.$nextTick(() => {
      this.textWidget = clone(textWidget);
    });
  }

  handleFilterChanged(option: SelectOption) {
    this.textWidget.fontSize = option.data;
  }

  private handlePickColor(newColor: string) {
    this.textWidget.textColor = newColor;
    Log.debug('PreviewText::handlePickColor::color::', newColor);
  }

  private handleBackgroundColorChanged(newColor: string) {
    this.textWidget.backgroundColor = newColor;
    Log.debug('PreviewText::handleBackgroundColorChanged::color::', newColor);
  }

  get selected() {
    if (this.textWidget) {
      const item = this.options.find(option => option.data === this.textWidget.fontSize);
      return item || this.options[0].data;
    } else {
      return this.options[0].data;
    }
  }

  private handleEditorModeChange(isHtml: boolean) {
    this.textWidget.isHtmlRender = isHtml;
  }
}

export default PreviewText;
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

.preview-text-panel {
  min-height: 241px;
  display: flex;
  align-items: center;
  height: 400px;

  &-left {
    width: 50%;
    height: 100%;
    background: var(--secondary);
    padding: 12px 12px 16px;
    border-radius: 4px;

    display: flex;
    flex-direction: column;

    .mode-selector {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .di-button {
        height: 32px;
      }

      .normal-button {
        background: #f2f2f7 !important;
      }
    }

    .text-editor {
      height: calc(100% - 40px - 32px - 40px);
      margin-bottom: 16px;
      padding: 12px;

      &::placeholder {
        margin-top: 5px;
      }
    }

    .editor-config {
      display: flex;
      align-items: center;

      .config-item {
        margin-right: 8px;
        label {
          height: 16px;
        }

        .form-control {
          height: 30px;
          background: var(--secondary);
        }

        .input-group {
          width: 140px;
          border-radius: 4px;

          .btn-color-picker {
            background-color: var(--secondary);
          }
        }

        .color-component {
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .select-container {
          width: 84px;
          margin-top: 0;
          button {
            height: 32px;
            background: var(--secondary) !important;
            border: 1px solid #f0f0f0;

            .form-control {
              height: 30px;
            }
          }
        }
      }
    }
  }

  &-right {
    width: 50%;
    background: var(--secondary);
    height: 100%;

    padding: 17px 12px 12px;
    border-radius: 4px;

    display: flex;
    flex-direction: column;
  }

  &-separate {
    margin-right: 11px;
  }

  #visualize {
    height: calc(100% - 22px);
    background-color: var(--input-background-color);
    border-radius: 4px;

    p {
      padding: 15px;
      word-break: break-word;
      border-radius: 4px;
    }
  }

  .modal-header {
    padding-bottom: 0;
  }
}
</style>
