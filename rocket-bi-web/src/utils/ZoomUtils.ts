export abstract class ZoomUtils {
  static getZoomLevels(zoom: { levels: string[][]; levelsAsMap: Map<string, number> }, currentLvl: string | undefined): string[] | undefined {
    const { levels, levelsAsMap } = zoom;
    if (currentLvl) {
      const index = levelsAsMap.get(currentLvl) ?? -1;
      return levels[index];
    }
    return undefined;
  }

  static canZoomIn(levels: string[] | undefined, currentLvl: string | undefined, step?: number): boolean {
    return !!this.getNextLevel(levels, currentLvl, step);
  }

  static canZoomOut(levels: string[] | undefined, currentLvl: string | undefined, step?: number): boolean {
    return !!this.getPreviousLevel(levels, currentLvl, step);
  }

  static getNextLevel(levels: string[] | undefined, currentLvl: string | undefined, step?: number): string | undefined {
    if (currentLvl && levels) {
      const index = levels.findIndex(lvl => lvl === currentLvl);
      return levels[index + (step ?? 1)];
    }
    return undefined;
  }

  static getPreviousLevel(levels: string[] | undefined, currentLvl: string | undefined, step?: number): string | undefined {
    if (currentLvl && levels) {
      const index = levels.findIndex(lvl => lvl === currentLvl);
      return levels[index - (step ?? 1)];
    }
    return undefined;
  }
}
