<template>
  <div class="di-social-icon">
    <a class="social-icon" :href="socialUrl" target="_blank">
      <img :src="socialIconSource" alt="social icon" />
      <span>{{ socialName }}</span>
    </a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class SocialIcon extends Vue {
  @Prop({ required: true })
  private readonly socialUrl!: string;

  @Prop({ required: true })
  private readonly socialIconSource!: string;

  @Prop({ required: true })
  private readonly socialName!: string;
}
</script>

<style lang="scss">
.di-social-icon {
  a {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--secondary-text-color);
    font-size: 12px;
    margin: 0 16px;

    img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 6px;
    }
  }
}
</style>
