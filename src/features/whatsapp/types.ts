export const NOTICE_KIND_IDS = [
  'appointment_confirmation',
  'appointment_reminder',
  'appointment_cancellation',
  'appointment_reschedule',
  'closure',
  'follow_up',
  'promotion',
  'discount',
] as const;

export type NoticeKind = (typeof NOTICE_KIND_IDS)[number];

export type NoticeCategory = 'UTILITY' | 'MARKETING';

export type ConnectionMethod = 'cloud_api' | 'embedded_signup';

export type TokenStorage = 'browser' | 'server';

export interface NoticeVariable {
  key: string;
  label: string;
  placeholder: string;
}

export interface NoticeDefinition {
  id: NoticeKind;
  label: string;
  description: string;
  category: NoticeCategory;
  templateName: string;
  body: string;
  footer: string;
  buttons?: string[];
  variables: NoticeVariable[];
  examples: string[];
}

export interface NoticeSetting {
  enabled: boolean;
  templateName: string;
  language: string;
  hoursBefore?: number;
}

export type NoticeSettings = Record<NoticeKind, NoticeSetting>;

export interface BusinessProfileSnapshot {
  about: string;
  address: string;
  description: string;
  email: string;
  websites: string[];
  vertical: string;
  profilePictureUrl: string | null;
}

export interface PublicConnection {
  clinicId: string;
  tokenStorage: TokenStorage;
  tokenPreview: string;
  method: ConnectionMethod;
  graphVersion: string;
  connectedAt: string;
  updatedAt: string;
  lastCheckedAt: string;
  phoneNumberId: string;
  wabaId: string | null;
  businessId: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  codeVerificationStatus: string | null;
  platformType: string | null;
  nameStatus: string | null;
  status: string | null;
  messagingLimitTier: string | null;
  isOfficialBusinessAccount: boolean | null;
  isOnBizApp: boolean | null;
  accountMode: string | null;
  throughputLevel: string | null;
  wabaName: string | null;
  currency: string | null;
  timezoneId: string | null;
  accountReviewStatus: string | null;
  businessVerificationStatus: string | null;
  ownershipType: string | null;
  templateNamespace: string | null;
  tokenExpiresAt: number | null;
  tokenIsValid: boolean | null;
  scopes: string[];
  warnings: string[];
  notices: NoticeSettings;
  appId: string | null;
  profile: BusinessProfileSnapshot | null;
}

export interface MetaCapabilities {
  graphVersion: string;
  serverCanReachMeta: boolean;
  serverProbe: string;
  appId: string | null;
  configId: string | null;
  solutionId: string | null;
  hasAppSecret: boolean;
  webhookVerifyToken: string;
  webhookPath: string;
}

export interface MetaTemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: Array<{ type?: string; text?: string }>;
}

export interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  language: string;
  category: string;
  rejected_reason?: string;
  components?: MetaTemplateComponent[];
}

export interface WebhookEvent {
  id: string;
  receivedAt: string;
  signatureVerified: boolean;
  wabaId?: string;
  field?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  summary: string;
  preview: string;
}

export interface SendResult {
  to: string;
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface EmbeddedSessionInfo {
  event: string;
  phoneNumberId: string | null;
  wabaId: string | null;
  businessId: string | null;
  currentStep: string | null;
  errorMessage: string | null;
  errorCode: string | null;
}
