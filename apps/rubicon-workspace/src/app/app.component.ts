import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  CustomActionsMap, getCurrentSync,
  init,
} from '@openfin/workspace-platform';
import {
  Dock,
  DockButtonNames,
  DockProvider, DockProviderRegistration,
  Home,
  Storefront,
  StorefrontFooter,
  StorefrontLandingPage
} from '@openfin/workspace';
import { OpenFin } from '@openfin/core';

import { WorkspacePlatformOverrideService } from './workspace-platform-override.service';


const PLATFORM_ID = "RubiconPlatform";
const PLATFORM_TITLE = "Rubicon Workspace";
const PLATFORM_ICON = "http://localhost:4200/favicon.ico";
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'rubicon-workspace';

  dockProvider: DockProvider = {
    id: PLATFORM_ID,
    title: PLATFORM_TITLE,
    icon: 'https://www.openfin.co/favicon-32x32.png',
    workspaceComponents: ['home', 'notifications', 'store', 'switchWorkspace'],
    disableUserRearrangement: false,
    buttons: [
      {
        tooltip: 'Sample Button 1',
        iconUrl: 'https://www.openfin.co/favicon-32x32.png',
        action: {
          id: 'sampleButton1',
        },
      },
      {
        type: DockButtonNames.DropdownButton,
        tooltip: 'Sample Dropdown Button',
        iconUrl: 'https://www.openfin.co/favicon-32x32.png',
        options: [
          {
            tooltip: 'Dropdown Button 1',
            iconUrl: 'https://www.openfin.co/favicon-32x32.png',
            action: {
              id: 'dropdownButton1',
              customData: 'dropdownButton1 clicked',
            },
          },
          {
            tooltip: 'Dropdown Button 2',
            iconUrl: 'https://www.openfin.co/favicon-32x32.png',
            action: {
              id: 'dropdownButton2',
              customData: 'dropdownButton2 clicked',
            },
          },
          {
            tooltip: 'Button with sub-options',
            options: [
              {
                tooltip: 'Nested button 1',
                iconUrl: 'https://www.openfin.co/favicon-32x32.png',
                action: {
                  id: 'nestedButton1',
                  customData: 'nestedButton1 clicked',
                },
              },
            ],
          },
        ],
      },
    ],
  };
  private registration: DockProviderRegistration | undefined;
  private currentView: OpenFin.View | undefined;
  private currentUrl: string | undefined;

  constructor(private workspacePlatformOverride: WorkspacePlatformOverrideService) {
    console.log('Rubicon Workspace constructor');
  }

  ngOnInit(): void {
    console.log('Initializing Rubicon Workspace');
    // Initialize the workspace platform
    // Provide default icons and default theme for the browser windows
    this.initializeWorkspacePlatform()
      .then((platform) => {
        console.log('Workspace platform initialized', platform);

        // Initialize dummy workspace components so that the buttons show in the dock.
        this.initializeWorkspaceComponents()
          .then((platform) => {
            console.log('Workspace components initialized', platform);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }

  dockGetCustomActions(): CustomActionsMap {
    return {
      sampleButton1: async (): Promise<void> => {
        // The favorite open is triggered when the entry in the dock is clicked
        console.log('Custom Actions Map: sampleButton1 clicked');
        await this.openUrl('https://www.openfin.co');
      },
    };
  }

  async openUrl(url: string): Promise<void> {
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
    const view = await platform.createView({ url }, browserWindowTarget);
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
              console.log(event, payload);
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

  private async initializeWorkspacePlatform() {
    console.log('Initializing workspace platform');
    // Add your platform initialization logic here


    await init({
      browser: {
        defaultWindowOptions: {
          icon: PLATFORM_ICON,
          workspacePlatform: {
            pages: [],
            favicon: PLATFORM_ICON,
          },
        },
      },
      theme: [
        {
          label: 'Default',
          default: 'dark',
          palette: {
            brandPrimary: '#0A76D3',
            brandSecondary: '#383A40',
            backgroundPrimary: '#1E1F23',
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
  }

  private async initializeWorkspaceComponents() {
    console.log('Initializing components');

    // Dummy home which can be launched by the dock
    await Home.register({
      title: PLATFORM_TITLE,
      id: PLATFORM_ID,
      icon: PLATFORM_ICON,
      onUserInput: async () => ({ results: [] }),
      onResultDispatch: async () => {
        // The favorite open is triggered when the entry in the dock is clicked
        console.log('Home result dispatched');
      },
    });

    // Dummy store which can be launched by the dock
    await Storefront.register({
      title: PLATFORM_TITLE,
      id: PLATFORM_ID,
      icon: PLATFORM_ICON,
      getApps: async () => [],
      getLandingPage: async () => ({} as StorefrontLandingPage),
      getNavigation: async () => [],
      getFooter: async () =>
        ({
          logo: { src: PLATFORM_ICON },
          links: [],
        } as unknown as StorefrontFooter),
      launchApp: async () => {
        // The favorite open is triggered when the entry in the dock is clicked
        console.log('Storefront app launched');
      },
    });

    // Perform the dock registration which will configure
    // it and add the buttons/menus
    try {
      this.registration = await Dock.register(this.dockProvider);
      console.log(this.registration);
      console.log('Dock provider initialized.');
    } catch (err) {
      console.error(
        'An error was encountered while trying to register the content dock provider',
        err
      );
    }
    await Dock.show();
  }



}
