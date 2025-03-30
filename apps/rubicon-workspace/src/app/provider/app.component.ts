import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as Notifications from '@openfin/workspace/notifications';
import { v4 as uuidv4 } from 'uuid';

import {
  BrowserButtonType,
  ColorSchemeOptionType,
  CustomActionCallerType,
  CustomActionPayload,
  CustomActionsMap,
  CustomPaletteSet,
  getCurrentSync,
  init,
  ToolbarButton,
} from '@openfin/workspace-platform';
import {
  Dock,
  DockProvider,
  DockProviderRegistration,
  Home,
  Storefront,
} from '@openfin/workspace';
import { OpenFin } from '@openfin/core';

import { WorkspacePlatformOverrideService } from '../services/openfin/workspace-platform-override.service';
import { DockProviderService } from '../services/openfin/dock-provider.service';
import { LogService } from '../services/logger/log.service';
import { StoreProviderService } from '../services/openfin/store-provider.service';
import { AppProviderSettings } from '../models/AppProviderSettings';
import { StorefrontProviderSettings } from '../models/StorefrontProviderSettings';
import { DEFAULT_PALETTES } from '../themes/default-palettes';

const PLATFORM_ID = 'RubiconPlatform';
const PLATFORM_TITLE = "Rubicon Workspace";
const PLATFORM_ICON = "http://localhost:4200/favicon.ico";



@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  //title = 'rubicon-workspace';


  // @ts-ignore
  private currentPalette: CustomPaletteSet;

  private registration: DockProviderRegistration | undefined;
  private currentView: OpenFin.View | undefined;
  private currentUrl: string | undefined;
  private dockProvider: DockProvider | undefined;

  // @ts-ignore
  private appProviderSettings: AppProviderSettings;
  // @ts-ignore
  private storefrontProviderSettings: StorefrontProviderSettings;
  private currentColorScheme: any;

  constructor(
    private workspacePlatformOverride: WorkspacePlatformOverrideService,
    private dockProviderService: DockProviderService,
    private storeProviderService: StoreProviderService,
    private logService: LogService
  ) {
    this.logService.info('Rubicon Workspace constructor');
  }

  ngOnInit(): void {
    this.logService.info('Initializing Rubicon Workspace');
    // Initialize the workspace platform
    // Provide default icons and default theme for the browser windows

    this.loadAllConfigs().then(() => {
      this.InitializeRubiconWorkspace()
        .then(() => {
          this.logService.info('Rubicon Workspace initialized');
        })
        .catch((err) => {
          console.error('Error initializing Rubicon Workspace', err);
        });
    });
  }

  private async loadAllConfigs() {
    await this.loadDockConfig();
    await this.loadStoreConfig();
  }

  private async loadStoreConfig() {
    await this.storeProviderService.loadConfigs();
    this.logService.info('Store provider initialized');
    const storeConfigs = this.storeProviderService.getStoreConfigs();
    this.appProviderSettings = storeConfigs.appProviderSettings;
    this.storefrontProviderSettings = storeConfigs.storefrontProviderSettings;
  }
  private async loadDockConfig() {
    this.dockProvider = await this.dockProviderService.getDockConfig();
  }

  private async InitializeRubiconWorkspace() {
    this.initializeWorkspacePlatform()
      .then((platform) => {
        this.logService.info('Workspace platform initialized', platform);

        this.initializeWorkspaceComponents()
          .then((platform) => {
            this.logService.info('Workspace components initialized', platform);
            // this.initColorScheme().then(() => {
            //   this.logService.info('Color scheme initialized');
            // });
          })
          .catch(console.error);
      })
      .catch(console.error);


  }

  private dockGetCustomActions(): CustomActionsMap {
    return {
      sampleButton1: async (payload: CustomActionPayload): Promise<void> => {
        // The favorite open is triggered when the entry in the dock is clicked
        this.logService.info(
          'Custom Actions Map: sampleButton1 clicked : ',
          payload
        );
        if (payload.callerType === CustomActionCallerType.CustomButton) {
          await this.openUrl(payload.customData);
        }
      },
    };
  }

  private async openUrl(url: string): Promise<void> {
    const platform = getCurrentSync();

    // See if we already have a browser window open.
    // We always use the first window for this demonstration
    // and only hook up the event listeners to that window
    // any additional windows would need this same logic
    // in a production system
    let browserWindows = await platform.Browser.getAllWindows();

    let browserWindowTarget: OpenFin.Identity | undefined;
    if (browserWindows.length > 0) {
      browserWindowTarget = browserWindows[0].identity;
    }

    // Open a view
    const view = await platform.createView(
      {
        url: url,
        name: 'New View',
        title: 'New View',
      },
      browserWindowTarget
    );
    this.currentUrl = url;
    this.currentView = view;

    // If there was no initial window then get it and hook up event listeners
    if (!browserWindowTarget) {
      // We have just opened a new browser window, so listen for events
      // so that we can update the state of the browser buttons
      browserWindows = await platform.Browser.getAllWindows();

      if (browserWindows.length > 0) {
        // Only hook-up the events to the first window
        // any subsequent windows would not be hooked up
        // and therefore not reflect the correct state of the buttons
        const events: ('view-focused' | 'options-changed' | 'url-changed')[] = [
          'view-focused',
          'options-changed',
          'url-changed',
        ];
        for (const event of events) {
          await browserWindows[0].openfinWindow.addListener(
            event,
            async (payload) => {
              this.logService.info(event, payload);
              // If the view has switched focus or the url has changed
              // then we need to update the browser buttons
              if ('viewIdentity' in payload) {
                this.currentView = fin.View.wrapSync(payload.viewIdentity);
              }
              if (this.currentView) {
                try {
                  const viewInfo = await this.currentView.getInfo();
                } catch {
                  // The view has closed so we need to clear the reference
                  this.currentView = undefined;
                }
              }
            }
          );
        }
      }
    }
  }

  getThemeButton(): ToolbarButton {
    return {
      type: BrowserButtonType.Custom,
      tooltip: "Theme",
      iconUrl: `http://localhost:4200/default/dark/theme.svg`,
      action: {
        id: "change-theme"
      }
    };
  }



   async  setColorScheme(schemeType: ColorSchemeOptionType): Promise<void> {
    console.log("Color Scheme Changed:", schemeType);


     this.currentPalette = DEFAULT_PALETTES['dark'];

    // Notify any components using the theming
    await this.notifyColorScheme();
  }



  async notifyColorScheme(): Promise<void> {
    const platform = getCurrentSync();

    // Iterate all the browser windows and update their buttons.
    const browserWindows = await platform.Browser.getAllWindows();
    for (const browserWindow of browserWindows) {
      await browserWindow.replaceToolbarOptions({ buttons: [this.getThemeButton()] });
    }

    // Broadcast a platform theme update so that views can change their colors.
    const appSessionContextGroup = await fin.me.interop.joinSessionContextGroup("platform/events");
    await appSessionContextGroup.setContext({
      type: "platform.theme",
      schemeType: 'dark',
      palette: this.currentPalette
    } as OpenFin.Context);
  }

  async  initColorScheme(): Promise<void> {
    const platform = getCurrentSync();
    const initTheme = await platform.Theme.getSelectedScheme();
    console.log("Initial Color Scheme:", initTheme);
    await this.setColorScheme(ColorSchemeOptionType.Dark);
  }

  private async initializeWorkspacePlatform() {
    this.logService.info('Initializing workspace platform');
    // Add your platform initialization logic here

    await init({
      browser: {
        defaultWindowOptions: {
          icon: PLATFORM_ICON,
          workspacePlatform: {
            pages: [],
            favicon: PLATFORM_ICON,
            toolbarOptions: {
              buttons: [this.getThemeButton()]
            }
          },
        },
      },
      theme: [
        {
          label: 'Default',
          default: 'dark',
          palettes: {
            dark: {
              brandPrimary: '#0A76D3',
              brandSecondary: '#383A40',
              backgroundPrimary: '#1E1F23',
              contentBackground1: "#07243d",
            },
            light: {
              brandPrimary: '#0A76D3',
              brandSecondary: '#1E1F23',
              backgroundPrimary: '#FAFBFE',
              // Demonstrate changing the link color for notifications
              linkDefault: '#FF0000',
              linkHover: '#00FF00',
            },
          },
          notificationIndicatorColors: {
            // This custom indicator color will be used in the Notification with Custom Indicator
            'custom-indicator': {
              dark: {
                background: '#FF0000',
                foreground: '#FFFFDD',
              },
              light: {
                background: '#FF0000',
                foreground: '#FFFFDD',
              },
            },
          },
        },
      ],
      // Get the custom actions from the dock which will be triggered
      // when the buttons are clicked
      customActions: this.dockGetCustomActions(),
      // Override some of the platform callbacks to provide loading
      // and saving to custom storage
      overrideCallback: this.workspacePlatformOverride.overrideCallback,
    });

    await Notifications.register({
      notificationsPlatformOptions: {
        id: PLATFORM_ID,
        icon: PLATFORM_ICON,
        title: PLATFORM_TITLE,
      },
    });
  }

  private async initializeWorkspaceComponents() {
    this.logService.info('Initializing components');

    // Dummy home which can be launched by the dock
    await Home.register({
      title: PLATFORM_TITLE,
      id: PLATFORM_ID,
      icon: PLATFORM_ICON,
      onUserInput: async () => ({ results: [] }),
      onResultDispatch: async () => {
        // The favorite open is triggered when the entry in the dock is clicked
        this.logService.info('Home result dispatched');
      },
    });

    // Dummy store which can be launched by the dock
    await Storefront.register({
      title: PLATFORM_TITLE,
      id: PLATFORM_ID,
      icon: PLATFORM_ICON,
      getApps: async () =>
        this.storeProviderService.addButtons(
          await this.storeProviderService.getApps(this.appProviderSettings)
        ),
      getLandingPage: async () => await this.storeProviderService.getLandingPage(this.appProviderSettings, this.storefrontProviderSettings),
      getNavigation: async () => await this.storeProviderService.getNavigation(this.appProviderSettings, this.storefrontProviderSettings),
      getFooter: async () => await this.storeProviderService.getFooter(this.storefrontProviderSettings),

      launchApp: async () => {
        // The favorite open is triggered when the entry in the dock is clicked
        this.logService.info('Storefront app launched');
      },
    });

    // Perform the dock registration which will configure
    // it and add the buttons/menus
    try {
      if (this.dockProvider) {
        this.registration = await Dock.register(this.dockProvider);
      }
      this.logService.info('Dock Registration:', this.registration);
      this.logService.info('Dock provider initialized.');
    } catch (err) {
      console.error(
        'An error was encountered while trying to register the content dock provider',
        err
      );
    }
    await Dock.show();
    await Storefront.show();
  }

  showNotification($event: MouseEvent) {
    this.showSimpleNotification().then(() => {
      this.logService.info('Notification sent');
    });
  }

  async showSimpleNotification(): Promise<void> {
    const notification: Notifications.NotificationOptions = {
      title: 'Simple Notification',
      body: 'This is a simple notification',
      toast: 'transient',
      category: 'default',
      template: 'markdown',
      id: uuidv4(),
      soundOptions: {
        mode: 'silent',
      },
      platform: PLATFORM_ID,
    };

    await Notifications.create(notification);
  }
}
