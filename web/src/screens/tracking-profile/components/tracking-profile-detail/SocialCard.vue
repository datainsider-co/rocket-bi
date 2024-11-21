<template>
  <div class="social-card text-center d-flex flex-column" @click="routerToLink" :class="{ disable: isDisabled }">
    <img width="40" height="40" class="social-icon ml-auto mr-auto unselectable" :src="require(`@/assets/icon/${icon}`)" :alt="name" />
    <span class="social-text unselectable">{{ name }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class SocialCard extends Vue {
  @Prop({
    type: String,
    required: true
  })
  icon!: string;

  @Prop({
    type: String,
    required: true
  })
  name!: string;

  @Prop({
    required: true
  })
  url!: string | undefined;

  constructor() {
    super();
  }

  routerToLink() {
    if (this.url) {
      window.open(this.url);
    }
  }

  get isDisabled() {
    return !this.url;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.social-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
}

.social-card.disable {
  opacity: 0.3;
  cursor: default;
  pointer-events: none;
}

.social-icon {
  order: 0;
}

.social-text {
  @include regular-text;
  opacity: 0.5;
  font-size: 12px;
  letter-spacing: 0.2px;
  text-align: center;
  order: 1;
  margin-top: 8px;
  cursor: pointer;
}

.social-card + .social-card {
  margin-left: 32px;
}
</style>
