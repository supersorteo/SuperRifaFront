export interface CreateReservationRequest {
  raffleSlug: string;
  numbers: number[];
  participant: ParticipantData;
  accessCode: string;
  paymentMethodId?: string;
}

export interface ParticipantData {
  fullName: string;
  email?: string;
  phone: string;
  dni?: string;
}

export interface ReservationResponse {
  id: string;
  status: string;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

export interface OrganizerReservation {
  id: string;
  participantName: string;
  participantPhone: string;
  participantEmail: string;
  participantDni: string;
  numbers: number[];
  totalAmount: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  raffleId: string;
  raffleTitle: string;
  raffleSlug: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface ParticipantLookupResult {
  participantName: string;
  raffleTitle: string;
  raffleSlug: string;
  reservations: ReservationSummary[];
}

export interface ReservationSummary {
  id: string;
  numbers: number[];
  totalAmount: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt?: string;
}
