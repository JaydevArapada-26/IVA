import { createBackendApplication } from './app';

async function main(): Promise<void> {
  const application = createBackendApplication();
  await application.start();
}

void main();
