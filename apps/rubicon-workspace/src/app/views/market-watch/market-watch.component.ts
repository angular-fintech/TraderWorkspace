import { Component } from '@angular/core';
import { Panel } from 'primeng/panel';
import { LogService } from '../../services/logger/log.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-market-watch',
  imports: [Panel, FormsModule],
  templateUrl: './market-watch.component.html',
  styleUrl: './market-watch.component.css',
})
export class MarketWatchComponent {
  ticker = 'MSFT';

  constructor(private logService: LogService) {}

  private async sendInstrumentContext() {
    const instrument = {
      type: 'fdc3.instrument',
      name: 'Microsoft',
      id: {
        ticker: this.ticker,
      },
    };
    await fin.me.interop.setContext(instrument);
  }

  sendContext($event: MouseEvent) {
    this.sendInstrumentContext().then(() => {
      this.logService.info('Context sent');
    });
  }
}
