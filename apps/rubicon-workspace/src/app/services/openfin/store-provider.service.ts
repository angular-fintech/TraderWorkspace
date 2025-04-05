import { Injectable } from '@angular/core';
import { LogService } from '../logger/log.service';
import { AppProviderSettings } from '../../models/AppProviderSettings';
import {
  StorefrontDetailedNavigationItemWithTags,
  StorefrontProviderSettings,
} from '../../models/StorefrontProviderSettings';
import {
  App, AppManifestType, StoreButtonConfig,
  StorefrontDetailedNavigationItem, StorefrontFooter,
  StorefrontLandingPage,
  StorefrontLandingPageMiddleRow,
  StorefrontNavigationItem,
  StorefrontNavigationSection,
  StorefrontTemplate
} from '@openfin/workspace';
import { OpenFin } from '@openfin/core';
import { getCurrentSync } from '@openfin/workspace-platform';

const NAVIGATION_SECTION_ITEM_LIMIT = 5;
const NAVIGATION_SECTION_LIMIT = 3;
const DETAILED_NAVIGATION_TOP_ROW_LIMIT = 4;
const DETAILED_NAVIGATION_MIDDLE_ROW_LIMIT = 6;
const DETAILED_NAVIGATION_BOTTOM_ROW_LIMIT = 3;

@Injectable({
  providedIn: 'root',
})
export class StoreProviderService {

  // @ts-ignore
  private appProviderSettings: AppProviderSettings;
  // @ts-ignore
  private storefrontProviderSettings: StorefrontProviderSettings

  lastCacheUpdate = 0;
  cachedApps: App[] = [];

  favoriteAppIds: string[] = [];

  constructor(private logService: LogService) {
    this.logService.info('StoreProviderService constructor');
  }

  public async loadConfigs() {
    this.logService.info('StoreProviderService loadConfigs');
    this.storefrontProviderSettings = await this.getStoreConfig();
    this.appProviderSettings = await this.getStoreAppsProvider();
  }

  public getStoreConfigs() {
    this.logService.info('StoreProviderService getStoreConfigs');
    return {
      appProviderSettings: this.appProviderSettings,
      storefrontProviderSettings: this.storefrontProviderSettings,
    };
  }

  //Load store-config.json via http and return it as a promise
  public async getStoreConfig(): Promise<any> {
    const response = await fetch('store-config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    this.logService.info('StoreProviderService getStoreConfig', data);
    return data;
  }
  // Load store apps provider via http and return it as a promise

  public async getStoreAppsProvider(): Promise<any> {
    const response = await fetch('store-app-provider.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    this.logService.info('StoreProviderService getStoreAppsProvider', data);
    return data;
  }

  async getFavoriteApps(appSettings: AppProviderSettings): Promise<App[]> {
    const apps = await this.getApps(appSettings);
    return apps.filter((a) => this.favoriteAppIds.includes(a.appId));
  }

  async getNavigationItem(
    appSettings: AppProviderSettings,
    id: string,
    title: string,
    tags: string[] | undefined
  ): Promise<StorefrontNavigationItem> {
    const navigationItem: StorefrontNavigationItem = {
      id: id ?? this.getId(title, tags),
      title,
      templateId: StorefrontTemplate.AppGrid,
      templateData: {
        apps: [],
      },
    };

    if (tags?.length && tags[0] === '@favorites') {
      navigationItem.templateData.apps = await this.getFavoriteApps(
        appSettings
      );
    } else {
      navigationItem.templateData.apps = await this.getAppsByTag(
        appSettings,
        tags
      );
    }

    return navigationItem;
  }

  async getNavigationItems<T>(
    appSettings: AppProviderSettings,
    items: (StorefrontDetailedNavigationItemWithTags)[],
    limit: number
  ): Promise<T> {
    const navigationItems: StorefrontNavigationItem[] = [];

    if (items.length > limit) {
      console.warn(
        `You have defined too many navigation items (${items.length}). Please limit it to ${limit} as we will only take the first ${limit}`
      );
    }

    for (const item of items.slice(0, limit)) {
      if (item) {
        const navigationItem = await this.getNavigationItem(
          appSettings,
          item.id,
          item.title,
          item.tags
        );
        navigationItems.push(navigationItem);
      }
    }

    return navigationItems as T;
  }

  getId(title: string, tags: string[] = []): string {
    const search = ' ';
    const replaceWith = '-';
    let result = title.replaceAll(search, replaceWith);
    result += `-${tags.join('-')}`;
    return result.toLowerCase();
  }

  async getFooter(storeSettings: StorefrontProviderSettings): Promise<StorefrontFooter> {
    console.log('Getting the store footer.');
    return storeSettings.footer;
  }

  async getNavigation<T>(
    appSettings: AppProviderSettings,
    storeSettings: StorefrontProviderSettings
  ): Promise<T> {
    console.log('Showing the store navigation.');

    const navigationSections: (StorefrontNavigationSection)[] = [];

    if (storeSettings.navigation === undefined) {
      return [] as T;
    }

    if (storeSettings.navigation.length > NAVIGATION_SECTION_LIMIT) {
      console.warn(
        `More than ${NAVIGATION_SECTION_LIMIT} navigation sections defined in StorefrontProvider settings. Only ${NAVIGATION_SECTION_LIMIT} are used.`
      );
    }

    for (const navigationItem of storeSettings.navigation.slice(
      0,
      NAVIGATION_SECTION_LIMIT
    )) {
      const navigationSection: StorefrontNavigationSection = {
        id: navigationItem.id ?? this.getId(navigationItem.title),
        title: navigationItem.title,
        items: await this.getNavigationItems(
          appSettings,
          navigationItem.items,
          NAVIGATION_SECTION_ITEM_LIMIT
        ),
      };
      navigationSections.push(navigationSection);
    }

    return navigationSections as T;
  }

  async getLandingPage(
    appSettings: AppProviderSettings,
    storeSettings: StorefrontProviderSettings
  ): Promise<StorefrontLandingPage> {
    console.log('Getting the store landing page.');
    const landingPage: Partial<StorefrontLandingPage> = {};

    if (storeSettings.landingPage.hero !== undefined) {
      const hero = storeSettings.landingPage.hero;
      landingPage.hero = {
        title: hero.title,
        image: hero.image,
        description: hero.description,
        cta: await this.getNavigationItem(
          appSettings,
          hero.cta.id,
          hero.cta.title,
          hero.cta.tags
        ),
      };
    }

    if (storeSettings.landingPage.topRow !== undefined) {
      landingPage.topRow = {
        title: storeSettings.landingPage.topRow.title,
        items: await this.getLandingPageRow(
          appSettings,
          storeSettings.landingPage.topRow.items,
          DETAILED_NAVIGATION_TOP_ROW_LIMIT
        ),
      };
    } else {
      console.error('You need to have a topRow defined in your landing page.');
    }

    if (storeSettings.landingPage?.middleRow !== undefined) {
      const middleRow = storeSettings.landingPage.middleRow;
      const middleRowApps = await this.getAppsByTag(
        appSettings,
        middleRow.tags
      );
      if (middleRowApps.length > DETAILED_NAVIGATION_MIDDLE_ROW_LIMIT) {
        console.warn(
          `Too many apps (${
            middleRowApps.length
          }) have been returned by the middle row tag definition ${middleRow.tags.join(
            ' '
          )}. Only ${DETAILED_NAVIGATION_MIDDLE_ROW_LIMIT} will be shown.`
        );
      }
      const validatedMiddleRowApps =
        this.addButtons<StorefrontLandingPageMiddleRow>(
          middleRowApps.slice(0, DETAILED_NAVIGATION_MIDDLE_ROW_LIMIT)
        );
      landingPage.middleRow = {
        title: middleRow.title,
        apps: validatedMiddleRowApps,
      };
    } else {
      console.error(
        'You need to have a middleRow defined in your landing page.'
      );
    }

    if (storeSettings.landingPage?.bottomRow !== undefined) {
      landingPage.bottomRow = {
        title: storeSettings.landingPage.bottomRow.title,
        items: await this.getLandingPageRow(
          appSettings,
          storeSettings.landingPage.bottomRow.items,
          DETAILED_NAVIGATION_BOTTOM_ROW_LIMIT
        ),
      };
    } else {
      console.error(
        'You need to have a bottomRow defined in your landing page.'
      );
    }

    return landingPage as StorefrontLandingPage;
  }

  async getApps(appSettings: AppProviderSettings): Promise<App[]> {
    if (appSettings) {
      const cacheDurationInMinutes = appSettings?.cacheDurationInMinutes ?? 1;
      const now = Date.now();
      if (now - this.lastCacheUpdate > cacheDurationInMinutes * 60 * 1000) {
        this.lastCacheUpdate = now;

        console.log('Requesting apps.');
        try {
          let apps: App[] = [];

          if (appSettings?.appSourceUrls) {
            for (const url of appSettings.appSourceUrls) {
              console.log('Requesting apps from url:', url);
              const response = await fetch(url, { credentials: 'include' });
              const json = await response.json();
              apps = apps.concat(json as App[]);
            }
          }

          this.cachedApps = await this.validateEntries(appSettings, apps);
        } catch (err) {
          console.error('Error retrieving apps. Returning empty list.', err);
          this.cachedApps = [];
        }
      }
    } else {
      console.warn('No appProvider settings in the manifest');
    }

    return this.cachedApps;
  }

  async validateEntries(
    appSettings: AppProviderSettings,
    apps: App[]
  ): Promise<App[]> {
    let canLaunchExternalProcessResponse;

    try {
      canLaunchExternalProcessResponse =
        await fin.System.queryPermissionForCurrentContext(
          'System.launchExternalProcess'
        );
    } catch (error) {
      console.error(
        'Error while querying for System.launchExternalProcess permission',
        error
      );
    }
    const canLaunchExternalProcess = canLaunchExternalProcessResponse?.granted;

    let canDownloadAppAssetsResponse;
    try {
      canDownloadAppAssetsResponse =
        await fin.System.queryPermissionForCurrentContext(
          'System.downloadAsset'
        );
    } catch (error) {
      console.error(
        'Error while querying for System.downloadAsset permission',
        error
      );
    }

    const canDownloadAppAssets = canDownloadAppAssetsResponse?.granted;

    const validatedApps: App[] = [];
    const rejectedAppIds = [];
    const appAssetTag = 'appasset';
    const supportedManifestTypes = appSettings?.manifestTypes;

    for (const element of apps) {
      const manifestType = element.manifestType;
      if (manifestType) {
        let validApp = true;
        const tags = element.tags;

        if (
          supportedManifestTypes !== undefined &&
          supportedManifestTypes.length > 0
        ) {
          validApp = supportedManifestTypes.includes(manifestType);
        }

        if (validApp) {
          if (element.manifestType !== 'external') {
            validatedApps.push(element);
          } else if (canLaunchExternalProcess === false) {
            rejectedAppIds.push(element.appId);
          } else if (
            Array.isArray(tags) &&
            tags.includes(appAssetTag) &&
            canDownloadAppAssets === false
          ) {
            rejectedAppIds.push(element.appId);
          } else {
            validatedApps.push(element);
          }
        } else {
          console.warn(
            'Apps.ts: validateEntries: Application is not in the list of supported manifest types',
            element.appId,
            manifestType
          );
        }
      }
    }

    if (rejectedAppIds.length > 0) {
      console.warn(
        "Apps.ts: validateEntries: Not passing the following list of applications as they will not be able to run on this machine due to missing permissions. Alternatively this logic could be moved to the launch function where a selection is not launched but the user is presented with a modal saying they can't launch it due to permissions.",
        rejectedAppIds
      );
    }

    return validatedApps;
  }

  async getLandingPageRow<T>(
    appSettings: AppProviderSettings,
    rowItems: (StorefrontDetailedNavigationItemWithTags)[],
    limit: number
  ): Promise<T> {
    const items: StorefrontDetailedNavigationItem[] = [];

    if (rowItems.length > limit) {
      console.warn(
        `You have defined too many storefront detailed navigation items (${rowItems.length}). Please keep it to the limit of ${limit} as only the first ${limit} will be returned.`
      );
    }

    for (const item of rowItems.slice(0, limit)) {
      if (item) {
        const navigationItem = await this.getNavigationItem(
          appSettings,
          item.id,
          item.title,
          item.tags
        );
        items.push({
          description: item.description,
          image: item.image,
          ...navigationItem,
        });
      }
    }

    return items as T;
  }

  async getAppsByTag(
    appSettings: AppProviderSettings,
    tags: string[] | undefined
  ): Promise<App[]> {
    if (tags) {
      const apps = await this.getApps(appSettings);

      return apps.filter((value: App) => {
        if (value.tags === undefined) {
          return false;
        }
        for (const tag of tags) {
          if (value.tags.includes(tag)) {
            return true;
          }
        }
        return false;
      });
    }

    return [];
  }

  addButtons<T>(apps: App[]): T {
    return apps.map((app) => ({
      ...app,
      ...this.calculateButtons(app),
    })) as T;
  }

  calculateButtons(app: App): {
    primaryButton: StoreButtonConfig;
    secondaryButtons: StoreButtonConfig[];
  } {
    return {
      ...app,
      primaryButton: {
        title: 'Launch',
        action: {
          id: 'launch-app',
          customData: app,
        },
      },
      secondaryButtons: [
        {
          title: this.favoriteAppIds.includes(app.appId)
            ? 'Remove Favorite'
            : 'Add Favorite',
          action: {
            id: 'favorite-toggle',
            customData: app,
          },
        },
      ],
    };
  }


  /**
   * Launch the passed app using its manifest type to determine how to launch it.
   * @param app The app to launch.
   * @returns The value returned by the launch.
   */
  async  launchApp(app: App): Promise<OpenFin.Platform | OpenFin.Identity | OpenFin.View | OpenFin.Application | undefined> {
    if (!app.manifest) {
      console.error(`No manifest was provided for type ${app.manifestType}`);
      return;
    }

    let ret: OpenFin.Platform | OpenFin.Identity | OpenFin.View | OpenFin.Application | undefined;

    console.log("Application launch requested:", app);

    switch (app.manifestType) {
      case AppManifestType.Snapshot: {
        const platform = getCurrentSync();
        ret = await platform.applySnapshot(app.manifest);
        break;
      }

      case AppManifestType.View: {
        const platform = getCurrentSync();
        ret = await platform.createView({ manifestUrl: app.manifest });
        break;
      }

      case AppManifestType.External: {
        ret = await fin.System.launchExternalProcess({ path: app.manifest, uuid: app.appId });
        break;
      }

      case "window": {
        const manifestResponse = await fetch(app.manifest);
        const manifest: OpenFin.WindowOptions = await manifestResponse.json();
        const platform = getCurrentSync();
        ret = await platform.createWindow(manifest);
        break;
      }

      case "inline-appasset": {
        const appAssetInfo: OpenFin.AppAssetInfo = app.manifest as unknown as OpenFin.AppAssetInfo;
        try {
          await fin.System.downloadAsset(appAssetInfo, (progress) => {
            const downloadedPercent = Math.floor((progress.downloadedBytes / progress.totalBytes) * 100);
            console.info(`Downloaded ${downloadedPercent}% of app asset with appId of ${app.appId}`);
          });

          ret = await fin.System.launchExternalProcess({
            alias: appAssetInfo.alias,
            arguments: appAssetInfo.args
          });
        } catch (error) {
          console.error(`Error trying to download app asset with app id: ${app.appId}`, error);
        }
        break;
      }

      default: {
        ret = await fin.Application.startFromManifest(app.manifest);
        break;
      }
    }

    console.log("Finished application launch request");

    return ret;
  }


}
