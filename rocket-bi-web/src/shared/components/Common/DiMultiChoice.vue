<template>
  <div @click.prevent="syncValue = !syncValue">
    <ActiveMultiChoiceIcon v-if="syncValue" role="button" />
    <DeactivateMultiChoiceIcon v-else role="button" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync } from 'vue-property-decorator';
import ActiveMultiChoiceIcon from '@/shared/components/Icon/ActiveMultiChoiceIcon.vue';
import DeactivateMultiChoiceIcon from '@/shared/components/Icon/DeactivateMultiChoiceIcon.vue';

@Component({ components: { ActiveMultiChoiceIcon, DeactivateMultiChoiceIcon } })
export default class DiMultiChoice extends Vue {
  @PropSync('value', { default: false })
  private syncValue!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, type: String })
  private readonly id!: string;
}
</script>

<style lang="scss" scoped></style>
