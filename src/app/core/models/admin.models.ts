export interface AdminOrganizer {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  businessName: string | null;
  active: boolean;
  createdAt: string;
  raffleCount: number;
}

export interface AdminOrganizerDetail extends AdminOrganizer {
  bio: string | null;
  instagramHandle: string | null;
  whatsappNumber: string | null;
  totalParticipants: number;
  raffles: AdminRaffle[];
}

export interface AdminRaffle {
  id: string;
  title: string;
  slug: string;
  publicationStatus: string;
  operationalStatus: string;
  totalNumbers: number;
  pricePerNumber: number;
  drawDateTime: string | null;
  createdAt: string;
  participantCount: number;
  firstImageUrl: string | null;
}
