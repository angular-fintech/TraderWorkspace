
import { Injectable } from '@angular/core';
import { LogEntry } from './log-entry.model';
import { LogLevel } from './log-level.model';
import { LogAppender } from './log-appender.interface';


@Injectable() // Make it injectable if it has dependencies later
export class ConsoleAppender implements LogAppender {

  log(entry: LogEntry): void {
    const message = `[${LogLevel[entry.level]}] ${entry.timestamp.toISOString()} - ${entry.message}`;

    // Use appropriate console method based on level
    // Pass additional params directly for better console inspection
    switch (entry.level) {
      case LogLevel.Error:
        console.error(message, ...entry.params);
        break;
      case LogLevel.Warn:
        console.warn(message, ...entry.params);
        break;
      case LogLevel.Info:
        console.info(message, ...entry.params);
        break;
      case LogLevel.Debug:
      case LogLevel.Trace: // Often just use console.debug or console.log for trace
        // Some browsers might filter debug level by default
        console.debug(message, ...entry.params);
        break;
      default:
        console.log(message, ...entry.params);
        break;
    }
  }
}
