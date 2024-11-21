<template>
  <div>
    <div v-for="(groupedField, index) in filtersGroupedFields" :key="`grouped-${index}`">
      <div v-if="isShowGroupedHeader" class="grouped-header">
        {{ groupedField.groupTitle }}
      </div>
      <div class="grouped-children">
        <slot :field="groupedField">
          <template v-for="(profileField, index) in groupedField.children">
            <div :key="`field-${index}`">
              <div :id="genBtnId('field-listing', index)" class="grouped-child unselectable btn-ghost" @click.prevent="$emit('on-click-field', profileField)">
                {{ profileField.displayName }}
              </div>
            </div>
          </template>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { GroupedField } from '../interfaces';

@Component
export default class FieldListingItem extends Vue {
  @Prop({ required: true, type: Array })
  filtersGroupedFields!: GroupedField[];

  @Prop({ default: true, type: Boolean })
  isShowGroupedHeader!: boolean;
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.grouped-header {
  @include semi-bold-text();
  letter-spacing: 0.6px;
}

.grouped-children {
  @include regular-text();
  letter-spacing: 0.2px;
  margin: 8px 0;
  opacity: 0.8;

  .grouped-child {
    padding: 8px 8px 8px 20px;
  }
}
</style>
