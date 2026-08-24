declare module 'node:http' {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    headers: Readonly<Record<string, string | string[] | undefined>>;
    on(event: 'data', listener: (chunk: string | Uint8Array) => void): IncomingMessage;
    on(event: 'end', listener: () => void): IncomingMessage;
  }

  export interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string | number | readonly string[]): void;
    writeHead(
      statusCode: number,
      headers?: Readonly<Record<string, string | number | readonly string[]>>,
    ): ServerResponse;
    end(chunk?: string): void;
  }

  export interface Server {
    listen(port: number, hostname?: string, callback?: () => void): Server;
    close(callback?: () => void): void;
  }

  export function createServer(
    requestListener: (request: IncomingMessage, response: ServerResponse) => void,
  ): Server;
}

declare const process: {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly stdout: {
    write(chunk: string): void;
  };
  readonly stderr: {
    write(chunk: string): void;
  };
  exitCode?: number;
};

declare const Deno: {
  readonly env: {
    get(name: string): string | undefined;
  };
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): {
    close(): void;
  };
};
