import { createApiClient, type ApiClientConfig } from './client';
import {
  createAdminApi,
  createAssistantApi,
  createAuthApi,
  createProfileApi,
  createSchemesApi,
  type IvaApi,
} from './resources';

export * from './client';
export * from './resources';

export function createIvaApi(config: ApiClientConfig): IvaApi {
  const client = createApiClient(config);
  return {
    schemes: createSchemesApi(client),
    profile: createProfileApi(client),
    auth: createAuthApi(client),
    assistant: createAssistantApi(client),
    admin: createAdminApi(client),
  };
}
