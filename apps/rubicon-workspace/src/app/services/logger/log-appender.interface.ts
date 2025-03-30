// src/app/core/logging/log-appender.interface.ts
import { LogEntry } from './log-entry.model';

export interface LogAppender {
  log(entry: LogEntry): void;
}
