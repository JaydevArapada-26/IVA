import { adminModule } from './admin';
import { assistantModule } from './assistant';
import { authModule } from './auth';
import { eligibilityModule } from './eligibility';
import { ingestionModule } from './ingestion';
import { profileModule } from './profile';
import { priorityModule } from './priority';
import { queueJobModule } from './queue-job';
import { schemesModule } from './schemes';
import { smsModule } from './sms';

export const backendModules = [
  authModule,
  profileModule,
  schemesModule,
  ingestionModule,
  eligibilityModule,
  priorityModule,
  assistantModule,
  smsModule,
  adminModule,
  queueJobModule,
] as const;
