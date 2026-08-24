export interface SecurityConfig {
  readonly cors: {
    readonly origin: string | string[];
    readonly credentials: boolean;
  };
  readonly rateLimit: {
    readonly windowMs: number;
    readonly max: number;
  };
}

export const securityConfig: SecurityConfig = {
  cors: {
    origin: '*',
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};
