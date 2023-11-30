<template>
  <div class="add-property-component">
    <div class="add-properties d-flex flex-row align-items-center mt-17px">
      <div>Add Properties</div>
      <DiIconTextButton class="ml-auto" title="Add" @click="handleAddProperty">
        <i class="di-icon-add"></i>
      </DiIconTextButton>
    </div>

    <div class="added-property">
      <div v-for="(item, index) in value" :key="index" class="added-property--row disable-edit">
        <div class="title new-extra-input input mb-0 mr-3" style="flex: 1" :title="item.key">
          <BFormInput :id="'key_' + index" readonly :value="item.key"></BFormInput>
        </div>
        <div class="extra-input input flex-2" style="flex: 1">
          <BFormInput :id="'value_' + index" readonly placeholder="Input value" :value="item.value"></BFormInput>
        </div>
        <div class="added-property--row--actions">
          <a href="#" class="text-button" @click="handleEditProperty(item, index)">
            <img src="@/screens/organization-settings/views/connector-config/icons/ic_edit.svg" alt="" />
          </a>
          <a href="#" class="text-button" @click="handleDeleteProperty(index)">
            <img src="@/screens/organization-settings/views/connector-config/icons/ic_trash.svg" alt="" />
          </a>
        </div>
      </div>
    </div>
    <ManagePropertyModal ref="managePropertyModal" />
  </div>
</template>
<script lang="ts">
import { Model, Ref, Vue } from 'vue-property-decorator';
import { Component } from 'vue-property-decorator';
import ManagePropertyModal from '@/screens/data-ingestion/form-builder/render-impl/ManagePropertyModal.vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { CustomPropertyInfo } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import { DIException } from '@core/common/domain';
import { ListUtils } from '@/utils';

export interface AddPropertyData {
  key: string;
  value: string;
}

@Component({
  components: { DiIconTextButton, ManagePropertyModal }
})
export default class AddPropertiesComponent extends Vue {
  @Model('change', { type: Array, default: () => [] })
  protected readonly value!: AddPropertyData[];

  @Ref()
  protected readonly managePropertyModal!: ManagePropertyModal;

  protected handleAddProperty(): void {
    this.managePropertyModal.showCreateProperty(async (newProperty: CustomPropertyInfo) => {
      const key: string = String(newProperty.fieldName).trim();
      const value: string = newProperty.fieldValue;
      const isExisted = this.value.find(item => item.key === key);
      if (isExisted) {
        throw new DIException('Property is existed');
      } else {
        const newFields = [...this.value, { key, value }];
        this.$emit('change', newFields);
      }
    });
  }

  protected handleEditProperty(item: AddPropertyData, index: number): void {
    this.managePropertyModal.showEditProperty(item.key, item.value, async newProperty => {
      const key: string = String(newProperty.fieldName).trim();
      const value: string = newProperty.fieldValue;
      const isExisted = this.value.find(item => item.key === key);
      if (key !== item.key && isExisted) {
        throw new DIException('Property is existed');
      } else {
        const newFields = [...this.value];
        newFields[index] = { key, value };
        this.$emit('change', newFields);
      }
    });
  }

  protected handleDeleteProperty(index: number): void {
    const newFields = ListUtils.removeAt(this.value, index);
    this.$emit('change', newFields);
  }
}
</script>

<style lang="scss">
.add-property-component {
  width: 100%;

  .added-property {
    display: flex;
    flex-direction: column;
    width: 100%;

    &--row {
      display: flex;
      flex-direction: row;
      border-radius: 4px;
      position: relative;

      .form-control {
        padding: 12px 10px;
        height: 40px;
        background: transparent;
        border: 1px solid #d6d6d6;
        &:focus {
          border: 2px solid #0066ff;
          padding: 12px 9px;
        }
      }

      &--actions {
        display: flex;
        align-items: center;
        position: absolute;
        right: 14.6px;
        top: 0;
        bottom: 0;
        margin: 0 auto;

        .text-button {
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            background-color: var(--icon-hover-color, #d6d6d6) !important;
          }

          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .text-button + .text-button {
          margin-left: 8px;
        }
      }

      &:not(:last-child) {
        margin-bottom: 2px;
      }

      &:first-child {
        margin-top: 17px;
      }
    }

    &--row.disable-edit {
      .form-control {
        background: #f0f0f0;
        border: 0px solid #d6d6d6;
        color: var(--secondary-text-color);
        padding: 12px 10px;
      }

      .extra-input .form-control {
        padding-right: 72px;
      }

      .form-item:last-child {
        .form-control {
          width: calc(100% - 56px - 14.6px);
        }
      }
    }
  }

  .add-properties {
    width: 100%;
    height: 20px;
    font-weight: 400;
    line-height: 19.6px;

    .btn-icon-text {
      height: 20px;
      padding: 4px;
      .title {
        margin-bottom: 0;
        color: #0066ff;
      }

      i {
        color: #0066ff;
      }
    }
  }

  .add-new-property {
    .title {
      font-size: 14px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 400;
      line-height: 19.6px;
      margin-bottom: 4px;
    }

    .title.required::after {
      content: ' *';
      color: #de3618;
    }

    .form-control {
      height: 40px;
      background: transparent;
      border: 1px solid #d6d6d6;
      padding: 12px 10px;
      &:focus {
        border: 2px solid #0066ff;
        padding: 12px 9px;
      }
    }

    .form-control.error {
      border: 2px solid #de3618;
    }

    .error-message {
      margin-top: 4px;
      font-size: 12px;
      color: #de3618;
      line-height: 16px;
      font-weight: 400;
    }
  }
}
</style>
