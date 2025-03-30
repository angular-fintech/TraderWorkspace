import { Injectable } from '@angular/core';
import { LogService } from './logger/log.service';

@Injectable({
  providedIn: 'root'
})
export class DockProviderService {

  constructor(private logService: LogService) {
    this.logService.info('DockProviderService constructor');
  }

  //Load dock-config.json via http and return it as a promise
  public async getDockConfig(): Promise<any> {
    const response = await fetch('dock-config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    this.logService.info('DockProviderService getDockConfig', data);
    return data;
  }

}
