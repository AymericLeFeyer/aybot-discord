export interface NotificationPayload {
  content: string;
}

export interface NotificationGateway {
  send(webhookUrl: string, payload: NotificationPayload): Promise<void>;
}
