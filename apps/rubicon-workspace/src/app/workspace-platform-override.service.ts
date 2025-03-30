import { Injectable } from '@angular/core';
import { WorkspacePlatformProvider } from '@openfin/workspace-platform';
import { OpenFin } from '@openfin/core';
import { DockProviderConfigWithIdentity } from '@openfin/workspace';


@Injectable({
  providedIn: 'root'
})
export class WorkspacePlatformOverrideService {

  constructor() {
    console.log('WorkspacePlatformOverrideService constructor');
  }

  public async overrideCallback(WorkspacePlatformProvider: OpenFin.Constructor<WorkspacePlatformProvider>) {
    class Override extends WorkspacePlatformProvider {
      public override async getDockProviderConfig(id: string): Promise<DockProviderConfigWithIdentity | undefined> {
        const config = await super.getDockProviderConfig(id);
        console.log('getDockProviderConfig Config ', config);
        return config;
      }

      public override async saveDockProviderConfig(config: DockProviderConfigWithIdentity): Promise<void> {
        console.log('saveDockProviderConfig Config ', config);
        return super.saveDockProviderConfig(config);
      }
    }

    return new Override();
  }

}
