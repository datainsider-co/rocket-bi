/* eslint-disable no-useless-escape */

export abstract class ShopifyUtils {
  private static SHOP_REGEX = /([a-zA-Z0-9][a-zA-Z0-9\-]*).myshopify.com/;
  // https://shopify.dev/apps/auth/oauth/getting-started
  static isShopValid(shop: string): boolean {
    return ShopifyUtils.SHOP_REGEX.test(shop);
  }

  static getShopName(shop: string): string | undefined {
    const groups: string[] = ShopifyUtils.SHOP_REGEX.exec(shop) ?? [];
    return groups[1];
  }
}
