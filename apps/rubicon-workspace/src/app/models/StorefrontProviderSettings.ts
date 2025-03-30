import type { Image, StorefrontDetailedNavigationItem, StorefrontFooter } from "@openfin/workspace";

/**
 * Extended type definition for navigation items with tags.
 */
export type StorefrontDetailedNavigationItemWithTags = StorefrontDetailedNavigationItem & {
  /**
   * Tags used to filter app lookups.
   */
  tags?: string[];
};

export interface StorefrontProviderSettings {
  /**
   * The id to register store with.
   */
  id: string;

  /**
   * The title to display on store.
   */
  title: string;

  /**
   * The icon to display in store.
   */
  icon: string;

  /**
   * The configuration for the landing page.
   */
  landingPage: {
    hero?: {
      title: string;
      description: string;
      cta: StorefrontDetailedNavigationItemWithTags;
      image: Image;
    };
    topRow: {
      title: string;
      items: StorefrontDetailedNavigationItemWithTags[];
    };
    middleRow: {
      title: string;
      tags: string[];
    };
    bottomRow: {
      title: string;
      items: StorefrontDetailedNavigationItemWithTags[];
    };
  };

  /**
   * Configuration for the navigation sections.
   */
  navigation: {
    id: string;
    title: string;
    items: StorefrontDetailedNavigationItemWithTags[];
  }[];

  /**
   * Configuration for the footer.
   */
  footer: StorefrontFooter;
}
