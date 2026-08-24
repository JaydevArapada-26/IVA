import { createIvaApi } from 'shared/api-client';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

let authToken: string | undefined;

export function setAuthToken(token: string | undefined) {
  authToken = token;
}

export const api = createIvaApi({
  baseUrl,
  getToken: () => authToken,
});
