<template>
  <div v-if="active">
    <slot name="active">
      <slot></slot>
    </slot>
  </div>
  <div v-else>
    <slot name="inactive">
      <div class="permission-inactive">
        <slot></slot>
      </div>
    </slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ActionType } from '@/utils/permission_utils';

@Component
export default class PermissionWidget extends Vue {
  @Prop({ required: true, type: Set })
  private readonly actionTypes!: Set<ActionType>;

  @Prop({ required: true, type: Array })
  private readonly allowedActions!: ActionType[];

  private get active(): boolean {
    return this.allowedActions.some(action => this.actionTypes.has(action));
  }
}
</script>

<style lang="scss">
.permission-inactive {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}
</style>
