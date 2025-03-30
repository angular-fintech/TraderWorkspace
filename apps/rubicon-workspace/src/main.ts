import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { MainComponent } from './app/main-component/main.component';


bootstrapApplication(MainComponent, appConfig).catch((err) =>
  console.error(err)
);
