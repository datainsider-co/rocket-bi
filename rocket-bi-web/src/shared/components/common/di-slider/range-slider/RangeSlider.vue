<template>
  <div
    class="input-group input-group--append-icon input-group--placeholder input-group--text-field input-group--select input-group--autocomplete input-group--multiple primary--text"
  >
    <slot></slot>
    <div class="range-slider-container">
      <input type="text" ref="range" />
    </div>
  </div>
</template>
<script src="./RangeSlider.js"></script>
<style src="./RangeSlider.css"></style>
<style src="./RangeSlider.scss" lang="scss"></style>
