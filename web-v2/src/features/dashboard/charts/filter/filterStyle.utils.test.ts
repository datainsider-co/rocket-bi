import { describe, expect, it } from 'vitest';
import { filterTitleStyle, tabFilterColors, tabFilterCssVars, tabFilterLook, treeFilterCssVars } from './filterStyle.utils';

describe('filterTitleStyle', () => {
  it('copies the stored font and color', () => {
    const title = { text: 'Region', style: { color: 'var(--text-color)', fontFamily: 'Roboto', fontSize: '20px', fontWeight: 'bold', align: 'center' } };
    expect(filterTitleStyle(title)).toEqual({ color: 'var(--text-color)', fontFamily: 'Roboto', fontSize: '20px', fontWeight: 'bold' });
  });

  it('is white without a stored color, like v1', () => {
    expect(filterTitleStyle({ style: { fontSize: '14px' } })).toEqual({ fontSize: '14px', color: '#fff' });
  });

  it.each([undefined, 'Region', null, { style: 'big' }])('reads %j as no style', title => {
    expect(filterTitleStyle(title)).toEqual({ color: '#fff' });
  });

  it('skips empty and non-string values', () => {
    expect(filterTitleStyle({ style: { fontSize: '', fontWeight: 500, color: '' } })).toEqual({ color: '#fff' });
  });
});

describe('tabFilterColors', () => {
  it('reads the tab colors for tabs and the dropdown', () => {
    const options = { activeColor: 'red', deActiveColor: 'blue', choiceActiveColor: 'green', textColor: '#333' };
    expect(tabFilterColors(options, 'normal')).toEqual({ active: 'red', deActive: 'blue', text: '#333' });
    expect(tabFilterColors(options, 'drop_down')).toEqual({ active: 'red', deActive: 'blue', text: '#333' });
  });

  it.each(['multi_choice', 'single_choice'])('reads the choice colors for %s', displayAs => {
    expect(tabFilterColors({ activeColor: 'red', choiceActiveColor: 'green', choiceDeActiveColor: 'grey' }, displayAs)).toEqual({
      active: 'green',
      deActive: 'grey',
      text: '#fff'
    });
  });

  it("falls back to v1's defaults", () => {
    expect(tabFilterColors({}, 'normal')).toEqual({
      active: 'var(--tab-filter-background-active)',
      deActive: 'var(--tab-filter-background-de-active)',
      text: '#fff'
    });
    expect(tabFilterColors({}, 'multi_choice')).toEqual({ active: '#57F', deActive: '#9799AC', text: '#fff' });
  });
});

describe('tabFilterLook', () => {
  it('reads display, direction and search', () => {
    const look = tabFilterLook({ displayAs: 'multi_choice', direction: 'column', search: { enabled: true, placeholder: 'Find' }, title: { style: { color: 'red' } } });
    expect(look).toMatchObject({ displayAs: 'multi_choice', direction: 'column', searchPlaceholder: 'Find', inline: false, titleStyle: { color: 'red' } });
  });

  it('defaults to normal tabs in a row with a search box', () => {
    expect(tabFilterLook({})).toMatchObject({ displayAs: 'normal', direction: 'row', searchPlaceholder: 'Search...', inline: false });
  });

  it('puts the title inline in a row without search box', () => {
    expect(tabFilterLook({ search: { enabled: false } })).toMatchObject({ searchPlaceholder: undefined, inline: true });
    expect(tabFilterLook({ search: { enabled: false }, direction: 'column' }).inline).toBe(false);
  });

  it('never shows a search box for the dropdown', () => {
    expect(tabFilterLook({ displayAs: 'drop_down', search: { enabled: true } })).toMatchObject({ searchPlaceholder: undefined, inline: true });
  });
});

describe('tabFilterCssVars', () => {
  it('maps the colors to variables', () => {
    expect(tabFilterCssVars({ active: 'a', deActive: 'b', text: 'c' })).toEqual({ '--filter-active': 'a', '--filter-de-active': 'b', '--filter-choice-text': 'c' });
  });
});

describe('treeFilterCssVars', () => {
  it('reads the stored colors and item style', () => {
    const options = { activeColor: 'red', deActiveColor: 'grey', switchColor: 'blue', choice: { style: { color: '#111', fontSize: '12px' } } };
    expect(treeFilterCssVars(options)).toEqual({
      '--tree-active': 'red',
      '--tree-de-active': 'grey',
      '--tree-switch-color': 'blue',
      '--tree-item-color': '#111',
      '--tree-item-size': '12px'
    });
  });

  it("falls back to v1's tree defaults and leaves the rest to the theme", () => {
    expect(treeFilterCssVars({ choice: { style: { color: '' } } })).toEqual({
      '--tree-active': 'var(--tab-filter-background-active)',
      '--tree-de-active': '#9799AC'
    });
  });
});
