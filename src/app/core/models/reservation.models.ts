export interface CreateReservationRequest {
  raffleSlug: string;
  numbers: number[];
  participant: ParticipantData;
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
