import 'ion-rangeslider';

export default {
  props: {
    from: {
      type: Number,
      default: 0
    },
    to: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    grid: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      default: () => ({})
    },
    fixFrom: {
      type: Boolean,
      default: false
    },
    fixTo: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'double',
      validate(value) {
        return ['single', 'double'].includes(value);
      }
    }
  },
  data() {
    return {
      slider: null
    };
  },
  watch: {
    to(newVal, oldVal) {
      if (newVal !== oldVal && this.slider) {
        if (newVal < this.slider.result.from) {
          this.slider.update({
            from: newVal
          });
        }
        this.$nextTick(() => {
          this.slider.update({
            to: newVal
          });
        });
      }
    },
    from(newVal, oldVal) {
      if (newVal !== oldVal && this.slider) {
        this.$nextTick(() => {
          this.slider.update({
            from: newVal
          });
        });
      }
    },
    min() {
      this.slider.update({
        min: this.min
      });
    },
    max() {
      this.slider.update({
        max: this.max
      });
    },
    step() {
      this.slider.update({
        step: this.step
      });
    },
    type() {
      this.slider.update({
        type: this.type
      });
    }
  },
  mounted() {
    this.from = this.from || 0;
    this.to = this.to || 0;
    this.min = this.min || 0;
    this.max = this.max || 100;
    this.step = this.step || 1;
    //
    this.range = $(this.$refs.range);
    this.inputFrom = this.$refs.from;
    this.inputTo = this.$refs.to;
    this.range.ionRangeSlider({
      ...this.options,
      type: this.type,
      min: this.min,
      max: this.max,
      from: this.from,
      to: this.to,
      step: this.step,
      skin: 'round',
      grid: this.grid,
      force_edges: true,
      hide_min_max: true, // show/hide MIN and MAX labels
      hide_from_to: true,
      //   onStart: this.updateInputs,
      //   onChange: this.updateInputs,
      onFinish: this.updateInputs,
      max_postfix: this.isDouble ? '+' : '',
      prettify_separator: ',',
      to_fixed: this.fixTo,
      from_fixed: this.fixFrom
    });
    this.slider = this.range.data('ionRangeSlider');
  },
  methods: {
    updateInputs(data) {
      this.$emit('update:from', data.from);
      this.$emit('update:to', data.to);
      this.$emit('change', data);
    }
  },
  computed: {
    isDouble() {
      return this.type === 'double';
    }
  }
};
