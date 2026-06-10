export interface RafflePublicResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  prize?: PrizeInfo;
  images: ImageInfo[];
  pricePerNumber: number;
  totalNumbers: number;
  availableCount: number;
  reservedCount: number;
  paidCount: number;
  drawDateTime?: string;
  timezone?: string;
  operationalStatus: string;
  publicationStatus: string;
  organizer: OrganizerPublicInfo;
  winnerNumber?: number;
  winnerName?: string;
  executedAt?: string;
  paymentMethods: PaymentMethodPublicInfo[];
}

export interface PrizeInfo {
  name: string;
  description?: string;
  estimatedValue?: number;
  imageUrl?: string;
}

export interface ImageInfo {
  url: string;
  altText?: string;
  coverImage: boolean;
  displayOrder: number;
}

export interface OrganizerPublicInfo {
  displayName: string;
  avatarUrl?: string;
  whatsappNumber?: string;
}

export interface PaymentMethodPublicInfo {
  type: string;
  displayName: string;
  alias?: string;
  cbuCvu?: string;
  accountHolder?: string;
  instructions?: string;
}

export interface NumberInfo {
  number: number;
  status: NumberStatus;
}

export type NumberStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'BLOCKED'
  | 'WINNER';

export interface CreateRaffleRequest {
  title: string;
  description?: string;
  totalNumbers: number;
  rangeStart?: number;
  rangeEnd?: number;
  pricePerNumber: number;
  drawDateTime?: string;
  timezone?: string;
  drawMethod: 'MANUAL' | 'AUTOMATIC' | 'EXTERNAL';
  drawPolicy: 'PAID_ONLY' | 'ALL_NUMBERS';
  termsAndConditions?: string;
  prizeName?: string;
  prizeDescription?: string;
  prizeEstimatedValue?: number;
}

export interface RaffleListItem {
  id: string;
  title: string;
  slug: string;
  publicationStatus: string;
  operationalStatus: string;
  totalNumbers: number;
  pricePerNumber: number;
  drawDateTime?: string;
  createdAt: string;
}
