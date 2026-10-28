import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { iconRevert, iconToggle, kpiIconDefaults, kpiThemeChanges, KPI_ICON_GROUPS, KPI_THEMES, numberLabelRevert, searchIcons } from './numberTabs.utils';

const viz = (options: object) => options as VizOptions;

describe('KPI_THEMES', () => {
  it("lists v1's six themes with their images", () => {
    expect(KPI_THEMES.map(theme => theme.id)).toEqual(['style_1', 'style_2', 'style_3', 'style_4', 'style_5', 'style_area_1']);
    expect(KPI_THEMES[5]?.image).toBe('/chart-builder/kpi-themes/style_area_1.jpg');
  });
});

describe('kpiThemeChanges', () => {
  const current = viz({
    title: { text: 'Revenue', style: { color: 'red' } },
    prefix: { text: '$' },
    icon: { iconClass: 'setting-icon-home', color: 'red' },
    trendLine: { enabled: true, color: 'red' }
  });

  it("replaces each of the theme's keys and keeps the chart's texts and icon", () => {
    const changes = kpiThemeChanges('style_area_1', current);
    expect(changes['theme']).toBe('style_area_1');
    expect(changes['background']).toBe('#FFFFFF');
    expect(changes['title']).toEqual({ align: 'left', enabled: true, text: 'Revenue', style: expect.objectContaining({ color: '#11152D' }) as object });
    expect(changes['prefix']).toMatchObject({ text: '$', enabled: true });
    expect(changes['icon']).toMatchObject({ iconClass: 'setting-icon-home', color: '#20C997' });
    expect(changes['trendLine']).toMatchObject({ enabled: true, color: '#20C997', displayAs: 'area' });
  });

  it('adds no text the chart does not have', () => {
    expect(kpiThemeChanges('style_1', viz({}))['subtitle']).not.toHaveProperty('text');
  });

  it('changes nothing for an unknown theme', () => {
    expect(kpiThemeChanges('style_99', current)).toEqual({});
  });
});

describe('kpiIconDefaults', () => {
  it("takes the chart theme's icon", () => {
    expect(kpiIconDefaults(viz({ theme: 'style_area_1' }))).toMatchObject({ iconClass: 'setting-icon-wallet-money-bold', border: '50px' });
  });

  it("falls back to style 1's", () => {
    expect(kpiIconDefaults(viz({}))).toMatchObject({ iconClass: 'setting-icon-empty-wallet-bold', border: '4px' });
    expect(kpiIconDefaults(viz({ theme: 'style_99' }))).toMatchObject({ iconClass: 'setting-icon-empty-wallet-bold' });
  });
});

describe('iconToggle', () => {
  it('only switches an icon the chart has', () => {
    expect(iconToggle(false, viz({ icon: { iconClass: 'setting-icon-home', enabled: true } }))).toEqual({ 'icon.enabled': false });
  });

  it("gives a chart without an icon its theme's, as chosen", () => {
    expect(iconToggle(true, viz({}))).toEqual({ icon: expect.objectContaining({ enabled: true, iconClass: 'setting-icon-empty-wallet-bold' }) as object });
    expect(iconToggle(false, viz({}))).toEqual({ icon: expect.objectContaining({ enabled: false }) as object });
  });
});

describe('iconRevert', () => {
  it("puts the theme's icon back", () => {
    expect(iconRevert(viz({}))).toMatchObject({ 'icon.iconClass': 'setting-icon-empty-wallet-bold', 'icon.color': '#BEE2CA', 'icon.border': '4px', 'icon.background': '#11152D' });
  });
});

describe('searchIcons', () => {
  const groups = [
    { group: 'Outlined', icons: ['setting-icon-home', 'setting-icon-wallet'] },
    { group: 'Inlined', icons: ['setting-icon-car'] }
  ];

  it('keeps every icon without a keyword', () => {
    expect(searchIcons(groups, '  ')).toEqual(groups);
  });

  it('filters by class, ignoring case, and drops empty groups', () => {
    expect(searchIcons(groups, ' WALL ')).toEqual([{ group: 'Outlined', icons: ['setting-icon-wallet'] }]);
  });

  it("has v1's icons", () => {
    expect(KPI_ICON_GROUPS.map(group => group.group)).toEqual(['Outlined', 'Inlined']);
  });
});

describe('numberLabelRevert', () => {
  it('resets the value, prefix and postfix fonts and clears the affixes', () => {
    const changes = numberLabelRevert();
    expect(changes).toMatchObject({ 'style.fontSize': '48px', 'prefix.style.color': 'var(--text-color)', 'postfix.style.fontFamily': 'var(--widget-secondary-font-family, Roboto)', 'prefix.text': '' });
    expect(Object.keys(changes)).toHaveLength(11);
  });
});
