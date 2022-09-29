<template>
  <EtlModal @submit="submit" ref="modal" actionName="Save" backdrop :width="400" title="Edit Field">
    <div v-if="target" class="oblock">
      <div class="form-group" :class="{ 'is-invalid': displayNameError }">
        <label>Field name</label>
        <input
          :id="genInputId('column-name')"
          v-model.trim="model"
          @keydown.enter="submit"
          type="text"
          class="form-control"
          autofocus
          placeholder="Field name"
          ref="input"
          :class="{ 'is-invalid': displayNameError }"
        />
        <p class="invalid-feedback text-danger">{{ displayNameError }}</p>
      </div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '../../../etl-modal/EtlModal.vue';
import { FieldConfiguration, ManageFieldOperator, NormalFieldConfiguration } from '@core/data-cook';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    EtlModal
  }
})
export default class ManageNormalField extends Vue {
  @Ref()
  private modal!: EtlModal;

  @Prop({ type: ManageFieldOperator, default: () => null })
  private readonly data: ManageFieldOperator | null = null;

  private target: NormalFieldConfiguration | null = null;
  private model = '';
  private displayNameError = '';

  edit(field: NormalFieldConfiguration) {
    this.target = field;
    this.model = field.displayName ?? '';
    this.displayNameError = '';
    // @ts-ignore
    this.modal?.show();
  }

  hide() {
    // @ts-ignore
    this.modal?.hide();
  }

  @Track(TrackEvents.ColumnSubmit, {
    column_old_name: (_: ManageNormalField) => _.target?.field.fieldName,
    column_new_name: (_: ManageNormalField) => _.model
  })
  submit() {
    // if (this.target) {
    //   this.target.displayName = this.model;
    // }
    if (this.data && this.target) {
      const fields: FieldConfiguration[] = (this.data.extraFields as FieldConfiguration[]).concat(this.data.fields.filter(f => f !== this.target));
      if (fields.find(f => f.displayName.toLowerCase().trim() === this.model.toLowerCase().trim())) {
        this.displayNameError = `Already exited field name`;
        (this.$refs.input as HTMLElement).focus();
        return;
      } else if (!this.model.trim()) {
        this.displayNameError = `Please input field name`;
        (this.$refs.input as HTMLElement).focus();
        return;
      } else {
        this.target.displayName = this.model;
        // this.target.field.fieldName = this.model;
        this.displayNameError = '';
        this.hide();
      }
    }
    // } else if (this.target) {
    //   this.target.displayName = this.model;
    //   this.target.field.fieldName = this.model;
    //   this.displayNameError = '';
    //   this.hide();
    // } else {
    //   this.displayNameError = '';
    // }
    // const fields: FieldConfiguration[] = (this.data.fields as FieldConfiguration[]).concat(this.data.extraFields.filter(f => f !== this.target));
    // if (fields.find(f => f.displayName.toLowerCase() === this.displayName.toLowerCase())) {
    //   this.displayNameError = `Already exited field name`;
    //   isInvalid = true;
    // }

    // this.hide();
  }
}
</script>
