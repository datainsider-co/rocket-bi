<template>
  <b-sidebar ref="sidebar" v-model="visible" right shadow lazy class="assistant-sidebar">
    <template #title>
      <div class="assistant-header">
        <div class="assistant-title">
          <ChatGPTIcon />
          <p>Assistant {{ currentModel }}</p>
        </div>

        <div ref="assistantSetting" id="assistantSetting" class="btn-icon-border" @click="openSettingMenu">
          <SettingIcon color="var(--btn-icon-color)" class="setting-btn" />
        </div>
      </div>
    </template>
    <AssistantBody
      ref="assistant"
      class="di-assistant"
      v-model="visible"
      :messages="messages"
      :options="botOptions"
      :bot-typing="typing"
      @msg-send="messageSendHandler"
    />
    <ContextMenu ref="diContextMenu" :ignoreOutsideClass="listIgnoreClassForContextMenu" minWidth="210px" textColor="var(--text-color)" />
  </b-sidebar>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { Log } from '@core/utils';
import { DIException } from '@core/common/domain';
import SettingIcon from '@/shared/components/Icon/SettingIcon.vue';
import { DataManager } from '@core/common/services';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { ContextMenuItem } from '@/shared';
import { OpenAiModels } from '@/shared/components/chat/controller/OpenAiModels';
import VueBotUI from '@/shared/components/chat/components/VueBotUI.vue';
import AssistantBody from '@/shared/components/chat/AssistantBody.vue';
import ChatGPTIcon from '@/shared/components/chat/components/ChatGPTIcon.vue';
import { ChatbotController, OpenAiController } from '@/shared/components/chat/controller/ChatbotController';
import { ChatbotOptions } from '@/shared/components/chat/controller/ChatOptions';
import { ErrorDetector } from './controller/error_detector/ErrorDetector';
import { ErrorMessageBuilder } from '@/shared/components/chat/controller/error_detector/ErrorMessageBuilder';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';
import { MessageAction } from '@/shared/components/chat/controller/MessageAction';
import { MessageActionValue } from '@/shared/components/chat/controller/MessageActionValue';
import { MessageType } from '@/shared/components/chat/controller/MessageType';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';

@Component({
  components: { ContextMenu, SettingIcon, ChatGPTIcon, VueBotUI, AssistantBody }
})
export default class AssistantSidebar extends Vue {
  models: [string, OpenAiModels][] = [
    ['GPT-4', OpenAiModels.Gpt4o],
    ['GPT-4 Turbo', OpenAiModels.Gpt4Turbo],
    ['GPT-3.5 Turbo', OpenAiModels.GPT35Turbo]
  ];
  visible = false;

  messages: any[] = [];
  typing = false;

  listIgnoreClassForContextMenu = ['btn-icon-border', 'setting-btn'];

  @Ref()
  protected diContextMenu!: ContextMenu;

  @Ref()
  protected readonly assistant!: AssistantBody;

  @Ref()
  protected readonly assistantSetting!: HTMLDivElement;

  controller: ChatbotController = new OpenAiController();

  get botOptions(): ChatbotOptions {
    return {
      colorScheme: `var(--accent)`,
      msgBubbleBgUser: 'var(--accent)'
    };
  }

  get currentModel(): string {
    const holdModel = this.models.find(model => model[1] === this.controller.model);
    if (holdModel) {
      const displayModel = holdModel[0];
      return `(${displayModel})`;
    }
    return '';
  }

  mounted() {
    this.$root.$on(DashboardEvents.ParseToAssistant, this.handleParseDataToAssistant);
  }

  beforeDestroy() {
    this.$root.$off(DashboardEvents.ParseToAssistant, this.handleParseDataToAssistant);
  }

  @Watch('visible')
  onSidebarVisible() {
    if (this.visible && !this.controller.initiated) {
      this.init();
    }
  }

  async init() {
    try {
      this.messages = [];
      this.typing = true;
      await this.controller.init(DataManager.getAssistantModel());
    } catch (ex) {
      Log.error('FloatingChatbot::init::error::', ex);
      this.handleError(ex);
    } finally {
      this.typing = false;
    }
  }

  async addSecretKey() {
    this.$root.$emit(DashboardEvents.ShowAddSecretKeyModal, async (key: string) => {
      try {
        await this.controller.createSecretKey(key);
        this.messages = [];
      } catch (ex) {
        Log.error('FloatingChatbot::init::error::', ex);
        this.handleError(ex);
      } finally {
        this.typing = false;
      }
    });
  }

  async updateSecretKey() {
    this.$root.$emit(DashboardEvents.ShowAddSecretKeyModal, async (key: string) => {
      try {
        await this.controller.removeSecretKey();
        await this.controller.createSecretKey(key);
        this.messages = [];
      } catch (ex) {
        Log.error('FloatingChatbot::init::error::', ex);
        this.handleError(ex);
      } finally {
        this.typing = false;
      }
    });
  }

  private handleError(ex: DIException) {
    let errorMsg: ChatMessageData | null;
    ///Not have key
    if (ErrorDetector.isAPIKeyNotFound(ex)) {
      errorMsg = ErrorMessageBuilder.getAPIKeyNotFoundMessage();
    } else if (ErrorDetector.isQuotaException(ex)) {
      errorMsg = ErrorMessageBuilder.getQuotaMessage();
    } else {
      errorMsg = ErrorMessageBuilder.getMessageFromException(ex);
    }

    errorMsg ? this.messages.push(errorMsg) : void 0;
  }

  messageSendHandler(msg: MessageAction) {
    Log.debug('messageSendHandler::', msg);
    if (msg.action === 'postback') {
      return this.handleAction(msg);
    }
    this.addMessage(msg);
    return this.completions();
  }

  private handleAction(msg: MessageAction) {
    switch (msg.value) {
      case MessageActionValue.tryAgain: {
        return this.init();
      }
      case MessageActionValue.addSecretKey: {
        return this.addSecretKey();
      }
    }
  }

  private addMessage(msg: { text: string }) {
    const userMessage = this.buildUserMessage(msg.text);
    this.messages.push(userMessage);
  }

  private async completions() {
    try {
      this.typing = true;
      const message: ChatMessageData = await this.controller.completion(this.messages);
      this.messages.push(message);
    } catch (ex) {
      Log.error('FloatingChatbot::messageSendHandler::error::', ex);
      this.handleError(ex);
    } finally {
      this.typing = false;
    }
  }

  private buildUserMessage(msg: string): ChatMessageData {
    return {
      role: OpenAiMessageRole.user,
      type: MessageType.text,
      text: msg
    };
  }

  private handleParseDataToAssistant(data: Blob) {
    Log.debug(`handleParseDataToAssistant::`, data);
    this.open();

    const reader = new FileReader();
    reader.readAsText(data);

    reader.onload = (event: any) => {
      const text = event.target.result;
      this.$nextTick(() => {
        this.assistant?.expandText(text);
      });
    };
  }

  public toggle() {
    this.visible = !this.visible;
  }

  public open() {
    this.visible = true;
    this.init();
  }

  public close() {
    this.visible = false;
  }

  private getModelContextMenu(): ContextMenuItem[] {
    return this.models.map(model => {
      return {
        text: model[0],
        click: () => {
          DataManager.setAssistantModel(model[1]);
          this.controller.init(model[1]);
        },
        active: DataManager.getAssistantModel() === model[1]
      };
    });
  }

  openSettingMenu(event: MouseEvent) {
    event.preventDefault();
    const items: ContextMenuItem[] = [
      {
        text: 'New chat',
        click: this.init
      },
      {
        text: 'Change Open Ai key',
        click: this.updateSecretKey
      },
      {
        text: 'Change model',
        click: () => {
          this.addSecretKey();
        },
        children: this.getModelContextMenu()
      }
    ];
    Log.debug('openSettingMenu', this.assistantSetting);
    this.diContextMenu.showAt('assistantSetting', items, { paddingTop: 8, placement: 'bottom' });
  }
}
</script>

<style lang="scss">
.assistant-sidebar {
  .bg-light {
    background: var(--white);
  }

  .text-dark {
    color: unset;
  }

  .b-sidebar.b-sidebar-right > .b-sidebar-header .close {
    margin-right: 0.5rem;
  }

  .b-sidebar-body {
    background: var(--white);
  }

  .assistant-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    .btn-icon-border {
      --btn-icon-color: white;

      &:hover {
        background-color: var(--white) !important;
        --btn-icon-color: var(--accent);
      }
    }
  }

  .assistant-title {
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 32px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .b-sidebar-header {
    background: var(--accent);

    strong {
      width: 100%;
    }

    p {
      padding-left: 6px;
      margin-bottom: 0;
    }
  }

  .di-assistant {
    text-align: start;
    word-break: break-word; //Text inside bubble
    white-space: pre-line;

    textarea {
      resize: none;
      color: var(--text-color);
    }
  }
  .di-context-menu-container ul {
    right: 0;
    left: unset !important;
  }
}
</style>
