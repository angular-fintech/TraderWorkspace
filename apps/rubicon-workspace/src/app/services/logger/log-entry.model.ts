import { LogLevel } from './log-level.model';


export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  message: string;
  params: any[]; // Store raw parameters for potential later processing
}
