import type { IncomingMessage, ServerResponse } from 'node:http';
import type { JsonValue } from './types';

export async function readTextBody(request: IncomingMessage): Promise<string> {
  const chunks: string[] = [];

  await new Promise<void>((resolve) => {
    request.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk));
    });

    request.on('end', () => {
      resolve();
    });
  });

  return chunks.join('');
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: JsonValue,
  headers: Readonly<Record<string, string>> = {},
): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(body));
}
