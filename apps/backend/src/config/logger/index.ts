import { BACKEND_LOG_PREFIX } from '../constants';

export interface LoggerConfig {
  readonly prefix: string;
  readonly defaultLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const loggerConfig: LoggerConfig = {
  prefix: BACKEND_LOG_PREFIX,
  defaultLevel: 'info',
};
