import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import DiButton from '@/shared/components/common/DiButton.vue';

describe('DiButton.vue', () => {
  it('renders props.msg when passed', () => {
    const title = 'new message';
    const wrapper = shallowMount(DiButton, {
      propsData: { title }
    });
    expect(wrapper.text()).to.include(title);
  });
});
