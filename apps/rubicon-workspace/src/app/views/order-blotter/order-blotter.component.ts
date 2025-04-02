import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/logger/log.service';
import { getCurrentSync } from '@openfin/workspace-platform';
import { Panel } from 'primeng/panel';
import { OpenFin } from '@openfin/core';
import { Textarea } from 'primeng/textarea';
import { InputText } from 'primeng/inputtext';


@Component({
  selector: 'app-order-blotter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule, Panel, Textarea, InputText],
  templateUrl: './order-blotter.component.html',
  styleUrl: './order-blotter.component.css',
})
export class OrderBlotterComponent implements OnInit {
  contextInfo = '';
  constructor(private logService: LogService, private cd: ChangeDetectorRef) {
    this.logService.info('OrderBlotterComponent');
  }

  ngOnInit(): void {
    // set title of the window use dom title is already present
    const title = document.title;
    this.logService.info('Order Blotter Component Initialized : ', title);
    // set title of the window
    document.title = 'Order Blotter';

    // get current OpenFin View

    getCurrentSync()
      .Browser.getAllWindows()
      .then((value) => {
        const w = value[0];
        fin.Window.wrapSync(w.identity)
          .getCurrentViews()
          .then((value1) => {
            const v = value1[0];

            this.logService.info(
              'Order Blotter Component Initialized : ',
              v.identity
            );
            this.logService.info(
              'Order Blotter Component Initialized : ',
              w.identity
            );
          });
      });

    this.handleOpenFinStuff().then((value) => {
      this.logService.info('Order Blotter Component Initialized : ', value);
    });
  }

  private async handleOpenFinStuff() {
    const plat = getCurrentSync();

    //await fin.me.interop.addContextHandler(this.handleInstrumentContext,'instrument');
    await fin.me.interop.addContextHandler((context) => {
      this.handleContext(context);
    });
  }

  private handleContext(contextInfo: OpenFin.Context) {
    this.logService.info('Context Handler Called : ', contextInfo);

    setTimeout(() => {
      this.contextInfo = JSON.stringify(contextInfo, null, 2);
      this.cd.detectChanges();
    }, 100);

    // handle context here
  }
}
