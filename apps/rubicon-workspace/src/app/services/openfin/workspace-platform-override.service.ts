import { Injectable } from '@angular/core';
import { WorkspacePlatformProvider } from '@openfin/workspace-platform';
import { OpenFin } from '@openfin/core';
import { DockProviderConfigWithIdentity } from '@openfin/workspace';
import { LogService } from '../logger/log.service';
import {
  AnalyticsEvent,
  CreateSavedWorkspaceRequest,
} from '@openfin/workspace-platform/client-api-platform/src/shapes';


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

      public override async createSavedWorkspace(workspaceRequest : CreateSavedWorkspaceRequest){
        console.info('createSavedWorkspace Request ', workspaceRequest);

        return super.createSavedWorkspace(workspaceRequest);
      }

      public override async getSavedWorkspace(workspaceId: string){
        console.info('getSavedWorkspace Request ', workspaceId);
        return super.getSavedWorkspace(workspaceId);
      }

      public override async getSavedWorkspaces(query: string){
        console.info('getSavedWorkspaces Request : ', query);
        const workspaces =await super.getSavedWorkspaces();
        console.info('getSavedWorkspaces Response : ', workspaces);
        return workspaces;

      }

      public override async  handleAnalytics(req: AnalyticsEvent[]): Promise<void> {
        console.info('handleAnalytics Request ', req);
        req.forEach((analyticsEvent) => {
          console.info('handleAnalytics Event ', analyticsEvent);
          // Handle the analytics event here
          // You can log it, send it to a server, etc.
        });
        return super.handleAnalytics(req);
      }

    }

    return new Override();
  }

}
