import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DockProviderService {

  constructor() {
    console.log('DockProviderService constructor');
  }

  //Load dock-config.json via http and return it as a promise
  public async getDockConfig(): Promise<any> {
    const response = await fetch('dock-config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('DockProviderService getDockConfig', data);
    return data;
  }

}
