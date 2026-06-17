export interface OrganizerProfile {
  id: string;
  email: string;
  fullName: string;
  businessName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  instagramHandle?: string;
  whatsappNumber?: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  businessName?: string;
  phone?: string;
  bio?: string;
  instagramHandle?: string;
  whatsappNumber?: string;
}

export type PaymentMethodType = 'MERCADO_PAGO' | 'ALIAS_CBU' | 'TRANSFER' | 'CASH' | 'WALLET' | 'OTHER';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  displayName: string;
  alias?: string;
  cbu?: string;
  cvu?: string;
  accountHolder?: string;
  instructions?: string;
  active: boolean;
  publicVisible: boolean;
  displayOrder: number;
  hasIntegrationToken?: boolean;
}

export interface PaymentMethodRequest {
  type: PaymentMethodType;
  displayName: string;
  alias?: string;
  cbu?: string;
  cvu?: string;
  accountHolder?: string;
  instructions?: string;
  publicVisible: boolean;
  displayOrder?: number;
  /** Solo para type=MERCADO_PAGO: access_token personal del organizer */
  mpAccessToken?: string;
}
