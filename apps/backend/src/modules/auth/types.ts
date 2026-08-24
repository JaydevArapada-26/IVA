export interface AuthSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly expiresAt: Date;
}
