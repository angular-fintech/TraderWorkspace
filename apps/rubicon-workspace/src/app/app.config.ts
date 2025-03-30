import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LOG_CONFIG, LogConfig } from './services/logger/log-config.model';
import { ConsoleAppender } from './services/logger/console.logger';
import { LogLevel } from './services/logger/log-level.model';

// --- Default Configuration ---
const DEFAULT_LOG_CONFIG: LogConfig = {
  level: LogLevel.Info, // Default level
  appenders: [new ConsoleAppender()], // Default to console output
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(appRoutes),
    { provide: LOG_CONFIG, useValue: DEFAULT_LOG_CONFIG },
  ],
};
