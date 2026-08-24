import { BACKEND_API_VERSION, BACKEND_DEFAULT_HOST, BACKEND_DEFAULT_PORT } from './config/constants';
import { loadBackendEnv } from './config/env';
import { createBackendServer } from './http/server';
import { backendRouteGroups } from './routes';
import { startEligibilityWorker, stopEligibilityWorker } from './workers/eligibility';
import { startSmsNotificationsWorker, stopSmsNotificationsWorker } from './workers/sms-notifications';
import { startDailySmsWorker, stopDailySmsWorker } from './workers/daily-sms';
import { attachAssistantWebSocket } from './ws/assistant-ws';

export interface BackendApplication {
  readonly host: string;
  readonly port: number;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createBackendApplication(): BackendApplication {
  const env = loadBackendEnv();
  const server = createBackendServer({
    host: env.host || BACKEND_DEFAULT_HOST,
    port: env.port || BACKEND_DEFAULT_PORT,
    routeGroups: backendRouteGroups,
    serviceName: 'backend',
    version: BACKEND_API_VERSION,
  });

  return {
    host: env.host,
    port: env.port,
    start: async () => {
      await server.start();
      attachAssistantWebSocket(server.httpServer);
      void startEligibilityWorker();
      void startSmsNotificationsWorker();
      startDailySmsWorker();
    },
    stop: async () => {
      stopEligibilityWorker();
      stopSmsNotificationsWorker();
      stopDailySmsWorker();
      await server.stop();
    },
  };
}

