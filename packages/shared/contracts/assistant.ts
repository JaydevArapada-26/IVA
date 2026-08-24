export interface AssistantMessageRequest {
  readonly conversationId?: string;
  readonly message: string;
  readonly language: string;
  readonly schemeId?: string;
  /** Discriminates typed text vs voice transcript input */
  readonly source?: 'text' | 'voice';
}


export interface AssistantMessageResponse {
  readonly conversationId: string;
  readonly reply: string;
  readonly configured: boolean;
}

export interface NotificationDto {
  readonly id: string;
  readonly notificationType: string;
  readonly channel: string;
  readonly status: string;
  readonly title: string;
  readonly body: string;
  readonly schemeId?: string;
  readonly readAt?: string;
  readonly createdAt: string;
}
