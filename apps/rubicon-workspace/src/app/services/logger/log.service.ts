// src/app/core/logging/log.service.ts
import { Injectable, Inject } from '@angular/core';
import { LogLevel } from './log-level.model';
import { LogConfig, LOG_CONFIG } from './log-config.model';
import { LogEntry } from './log-entry.model';

@Injectable({
  providedIn: 'root', // Provided in root by default via LoggingModule
})
export class LogService {
  private config: LogConfig;

  constructor(@Inject(LOG_CONFIG) config: LogConfig) {
    // Defensive copy if config could be mutated elsewhere
    this.config = { ...config };
  }

  // --- Public API for logging ---

  trace(message: string, ...params: any[]): void {
    this.writeLog(LogLevel.Trace, message, params);
  }

  debug(message: string, ...params: any[]): void {
    this.writeLog(LogLevel.Debug, message, params);
  }

  info(message: string, ...params: any[]): void {
    this.writeLog(LogLevel.Info, message, params);
  }

  warn(message: string, ...params: any[]): void {
    this.writeLog(LogLevel.Warn, message, params);
  }

  error(message: string, ...params: any[]): void {
    this.writeLog(LogLevel.Error, message, params);
  }

  // --- Core log writing method ---

  private writeLog(level: LogLevel, message: string, params: any[]): void {
    // *Performance Critical Check:* Bail out early if the level is not sufficient
    if (!this.shouldLog(level)) {
      return;
    }

    // Only create entry and call appenders if level is met
    const entry: LogEntry = {
      level,
      message,
      params, // Pass raw params
      timestamp: new Date(),
      // Add context here if needed, e.g., from config.globalContext
    };

    // Delegate to configured appenders
    this.config.appenders.forEach(appender => {
      try {
        // Consider making appender calls async if they involve I/O
        // For high perf, keep console sync, make HTTP async.
        appender.log(entry);
      } catch (error) {
        console.error('Error in logging appender:', error);
        // Avoid crashing the app due to a faulty appender
      }
    });
  }

  // *Performance Critical Check:* Determines if a log should be processed
  private shouldLog(level: LogLevel): boolean {
    return this.config.level !== LogLevel.Off && level <= this.config.level;
  }

  // --- Utility to update level dynamically if needed ---
  setLevel(level: LogLevel): void {
    // You might want more robust config updates depending on complexity
    this.config.level = level;
  }
}
