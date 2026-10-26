import { describe, expect, it } from 'vitest';
import { canStartDragFrom, FIELD_NO_DRAG_CLASS } from './FieldPointerSensor';

function inside(html: string, selector: string): Element {
  const root = document.createElement('div');
  root.innerHTML = html;
  const element = root.querySelector(selector);
  if (!element) throw new Error(`no ${selector}`);
  return element;
}

describe('canStartDragFrom', () => {
  it.each([
    ['plain text', '<div><span id="t">price</span></div>'],
    ['a button (clicks still work: drags need movement)', '<div><button id="t">x</button></div>'],
    ['an element with contenteditable="false"', '<div contenteditable="false"><span id="t">a</span></div>']
  ])('allows %s', (_, html) => {
    expect(canStartDragFrom(inside(html, '#t'))).toBe(true);
  });

  it.each([
    ['an input', '<input id="t" />'],
    ['a textarea', '<textarea id="t"></textarea>'],
    ['a select', '<select id="t"></select>'],
    ['a contenteditable element', '<div contenteditable="true"><b id="t">a</b></div>'],
    ['an empty contenteditable attribute', '<div contenteditable=""><b id="t">a</b></div>'],
    ['a no-drag element', `<div class="${FIELD_NO_DRAG_CLASS}"><span id="t">a</span></div>`]
  ])('refuses %s', (_, html) => {
    expect(canStartDragFrom(inside(html, '#t'))).toBe(false);
  });

  it('allows a target that is not an element', () => {
    expect(canStartDragFrom(null)).toBe(true);
    expect(canStartDragFrom(document.createTextNode('a'))).toBe(true);
  });
});
