abstract class RandomUtils {
  /**
   * @param min default is 0
   * @param max default is 1000
   * return number in [min, max]
   */
  static nextInt = (min = 0, max = 1000): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  static nextBool = (): boolean => {
    return RandomUtils.nextInt(0, 1) === 1;
  };

  static nextString(length = 10): string {
    const result = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; ++i) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
  }
}

export { RandomUtils };
