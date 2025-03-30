export interface AppProviderSettings {
  /**
   * A list of endpoints that return apps in JSON format.
   */
  appSourceUrls: string[];

  /**
   * The types of apps that we allow.
   */
  manifestTypes?: string[];

  /**
   * How long to store the apps before getting a new list.
   */
  cacheDurationInMinutes?: number;
}
