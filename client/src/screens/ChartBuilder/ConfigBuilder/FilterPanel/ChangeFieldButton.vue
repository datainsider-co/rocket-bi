<template>
  <div>
    <DiButton :id="randomId" class="display-name text-decoration-none change-field-btn text-nowrap" @click="handleClickButton" :title="title"></DiButton>
    <BPopover :show.sync="isShowPopover" :target="randomId" custom-class="popover-dropdown" placement="bottom-right" triggers="blur click">
      <div class="popover-custom">
        <StatusWidget :error="errorMessage" :status="fieldContextStatus">
          <vuescroll>
            <div class="list-profile-field">
              <div v-for="(profileField, i) in profileFields" :key="i" class="active" @click="handleChangeField(profileField)">
                <li>
                  <a href="#">{{ profileField.displayName }}</a>
                  <span v-if="title === profileField.displayName">&#10003;</span>
                </li>
              </div>
            </div>
          </vuescroll>
        </StatusWidget>
      </div>
    </BPopover>
  </div>
</template>
<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { ConditionTreeNode, Status } from '@/shared';
import { RandomUtils, SchemaUtils } from '@/utils';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';

@Component
export default class ChangeFieldButton extends Vue {
  @Prop({ required: true, type: String })
  errorMessage!: string;

  @Prop({ required: true })
  fieldContextStatus!: Status;

  @Prop({ required: true, type: Array })
  profileFields!: FieldDetailInfo[];

  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: true })
  conditionTreeNode!: ConditionTreeNode;

  @Prop({ required: true, type: Number })
  nodeIndex!: number;

  private isShowPopover = false;

  private randomId = RandomUtils.nextInt(0, 50000).toString();

  @Emit('handleClickButton')
  private handleClickButton() {
    this.isShowPopover = !this.isShowPopover;
    return { conditionTreeNode: this.conditionTreeNode, index: this.nodeIndex };
  }

  @Emit('handleChangeField')
  private handleChangeField(profileField: FieldDetailInfo) {
    this.isShowPopover = false;
    return profileField;
  }

  private get fieldDetailInfo(): string {
    return SchemaUtils.getFieldName(this.conditionTreeNode);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.change-field-btn {
  background: none;
  border: none;
}

.display-name {
  @include bold-text();
  font-size: 14px;
  margin: 0;
  padding: 0 4px;
  text-decoration: underline;
}

.popover-dropdown {
  background: none;
  border: none;
  max-width: unset;

  ::v-deep {
    .arrow {
      display: none;
    }
  }

  .popover-custom {
    background: var(--primary);
    max-width: 200px;
    min-height: 250px;
    height: 250px;
    border-radius: 4px;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);

    .list-profile-field {
      max-height: 150px;
      //padding: 8px;
      li {
        display: flex;
        list-style: none;
        padding: 8px;

        a {
          color: var(--secondary-text-color);
          font-size: 14px;
          margin-right: auto;
          text-decoration: none;
        }

        span {
          color: #1d8cf8;
          font-size: 14px;
        }

        &:hover {
          background-color: var(--hover-color);
          a {
            color: var(--text-color);
          }
        }
      }
    }
  }
}
</style>
