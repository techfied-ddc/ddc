// Adapter interfaces for all notification channels.
// Business logic imports from here; vendor SDKs never leak into services.

export interface SmsAdapter {
  send(to: string, message: string, templateId?: string): Promise<void>;
}

export interface PushAdapter {
  send(subscription: PushSubscription, payload: PushPayload): Promise<void>;
}

export interface EmailAdapter {
  send(opts: EmailOptions): Promise<void>;
}

export interface PushSubscription {
  endpoint: string;
  p256dh:   string;
  auth:     string;
}

export interface PushPayload {
  title:   string;
  body:    string;
  icon?:   string;
  badge?:  string;
  data?:   Record<string, unknown>;
}

export interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}
