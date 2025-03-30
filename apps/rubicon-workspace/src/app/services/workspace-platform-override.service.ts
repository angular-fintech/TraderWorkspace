import { Injectable } from '@angular/core';
import { WorkspacePlatformProvider } from '@openfin/workspace-platform';
import { OpenFin } from '@openfin/core';
import { DockProviderConfigWithIdentity } from '@openfin/workspace';
import { LogService } from './logger/log.service';


@Injectable({
  providedIn: 'root'
})
export class WorkspacePlatformOverrideService {

  constructor(private logService: LogService) {
    this.logService.info('WorkspacePlatformOverrideService constructor');
  }

  public async overrideCallback(WorkspacePlatformProvider: OpenFin.Constructor<WorkspacePlatformProvider>) {
    class Override extends WorkspacePlatformProvider {
      constructor() {
        super();
        console.info('Override constructor');
      }

      public override async getDockProviderConfig(id: string): Promise<DockProviderConfigWithIdentity | undefined> {
        const config = await super.getDockProviderConfig(id);
        console.info('getDockProviderConfig Config ', config);
        return config;
      }

      public override async saveDockProviderConfig(config: DockProviderConfigWithIdentity): Promise<void> {
        console.info('saveDockProviderConfig Config ', config);
        return super.saveDockProviderConfig(config);
      }
    }

    return new Override();
  }

}
