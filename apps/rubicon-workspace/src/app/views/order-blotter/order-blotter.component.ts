import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/logger/log.service';
import {
  BrowserButtonType, CustomPaletteSet,
  getCurrentSync,
  ToolbarButton
} from '@openfin/workspace-platform';
import { OpenFin } from '@openfin/core';
import { DEFAULT_PALETTES } from '../../themes/default-palettes';

@Component({
  selector: 'app-order-blotter',
  imports: [FormsModule],
  templateUrl: './order-blotter.component.html',
  styleUrl: './order-blotter.component.css',
})
export class OrderBlotterComponent implements OnInit {

  // @ts-ignore
  private currentPalette: CustomPaletteSet;

  constructor(private logService: LogService) {
    this.logService.info('OrderBlotterComponent');
  }

  ngOnInit(): void {
    // set title of the window use dom title is already present
    const title = document.title;
    this.logService.info('Order Blotter Component Initialized : ', title);
    // set title of the window
    document.title = 'Order Blotter';

    this.currentPalette = DEFAULT_PALETTES['dark'];
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


  setTheme($event: MouseEvent) {
    this.notifyColorScheme().then(() => {
      this.logService.info('Theme changed to dark');
    });
  }
}
