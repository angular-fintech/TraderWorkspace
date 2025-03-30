import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/logger/log.service';

@Component({
  selector: 'app-order-blotter',
  imports: [FormsModule],
  templateUrl: './order-blotter.component.html',
  styleUrl: './order-blotter.component.css',
})
export class OrderBlotterComponent implements OnInit {

  constructor(private logService: LogService) {
    this.logService.info('OrderBlotterComponent');
  }

  ngOnInit(): void {
    // set title of the window use dom title is already present
    const title = document.title;
    this.logService.info('Order Blotter Component Initialized : ', title);
    // set title of the window
    document.title = 'Order Blotter';


  }

}
