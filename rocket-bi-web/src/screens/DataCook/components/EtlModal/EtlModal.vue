<template>
  <Modal ref="modal" :class="{ 'custom-backdrop': backdrop }" :backdrop="backdrop" :width="width" class="modal-operator" hide-footer @hidden="$emit('hidden')">
    <template slot="header">
      <slot name="header">
        <h4 class="mr-auto">{{ title }}</h4>
      </slot>
    </template>
    <template slot="header-action">
      <DiButton :border="borderCancel" :class="{ border: borderCancel }" class="mr-3" @click.prevent="cancel">
        {{ backName }}
      </DiButton>
      <button :disabled="loading || disabled" class="btn btn-sm btn-primary px-3" @click.prevent="submit">
        <i v-if="loading" class="fa fa-spin fa-spinner"></i>
        {{ actionName }}
      </button>
    </template>
    <!--    <div v-if="loading" class="oblock">-->
    <!--      <div style="height: 153px">-->
    <!--        <LoadingComponent v-if="loading"> </LoadingComponent>-->
    <!--      </div>-->
    <!--    </div>-->
    <slot></slot>
  </Modal>
</template>
<script lang="ts" src="./EtlModal.ctrl.ts"></script>
<style lang="scss" scoped>
.modal-operator {
  text-align: left;
  ::v-deep .modal-content {
    background-color: var(--primary) !important;
  }
  &[secondary-background-color] {
    ::v-deep .modal-content {
      background-color: var(--secondary) !important;
    }
  }

  ::v-deep .oblock {
    background-color: var(--secondary);
    padding: 24px;
    border-radius: 4px;

    .form-group {
      margin-bottom: 1.6rem;

      label {
        font-size: 14px;
        opacity: 0.8;
      }

      > .form-control {
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  }

  &.custom-backdrop {
    background: rgba(0, 0, 0, 0.7);
  }

  //
  //.btn-secondary.btn-operator-cancel {
  //  border: none ;
  //}
  //
  //.border{
  //    border: solid #d6d6d6 1px !important;
  //  pa
  //}

  ::v-deep {
    .di-button {
      height: 24.67px;
    }

    .ant-popover {
      --primary: var(--menu-background-color);
      --vc-reset: rgba(0, 0, 0, 0.2);
    }

    .filter-popover-area {
      --primary: var(--menu-background-color);
      --secondary: var(--input-background-color);
      --vc-reset: rgba(0, 0, 0, 0.2);
      border: none;

      .select-popover {
        ul li {
          &:hover {
            background: var(--active-color);
          }

          &.active.selected {
            background: var(--hover-color);
          }
        }
      }
    }

    .di-context-menu-container,
    .modal,
    .popover-body {
      --primary: var(--menu-background-color);
    }

    .select-popover {
      ul li {
        &:hover {
          background: var(--active-color) !important;
        }

        &.active.selected {
          background: var(--hover-color);
        }
      }
    }

    .modal {
      .modal-footer {
        border: none !important;

        .select-popover {
          ul li {
            &:hover {
              background: var(--active-color);
            }

            &.active.selected {
              background: var(--hover-color);
            }
          }
        }
      }
    }
  }
}
</style>
