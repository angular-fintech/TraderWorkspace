
// src/app/core/logging/log-config.model.ts
import { LogLevel } from './log-level.model';
import { LogAppender } from './log-appender.interface';
import { InjectionToken } from '@angular/core';

export interface LogConfig {
  level: LogLevel; // Minimum level to log
  appenders: LogAppender[]; // Destinations for log entries
  // Add other config options like global context if needed
  // globalContext?: Record<string, any>;
}

// Token for injecting the configuration
export const LOG_CONFIG = new InjectionToken<LogConfig>('log.config');
