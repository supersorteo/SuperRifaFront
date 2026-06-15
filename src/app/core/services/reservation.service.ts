import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CreateReservationRequest,
  OrganizerReservation,
  PageResponse,
  ParticipantLookupResult,
  ReservationResponse,
  ReservationStatus
} from '../models/reservation.models';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);

  create(req: CreateReservationRequest) {
    return this.http.post<ReservationResponse>(`${environment.apiUrl}/public/reservations`, req);
  }

  listOrganizerReservations(raffleId?: string, phone?: string, status?: ReservationStatus, page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    if (raffleId) params = params.set('raffleId', raffleId);
    if (phone)    params = params.set('phone', phone);
    if (status)   params = params.set('status', status);
    return this.http.get<PageResponse<OrganizerReservation>>(`${environment.apiUrl}/organizer/reservations`, { params });
  }

  confirmReservation(id: string) {
    return this.http.put<OrganizerReservation>(`${environment.apiUrl}/organizer/reservations/${id}/confirm`, {});
  }

  cancelReservation(id: string) {
    return this.http.put<OrganizerReservation>(`${environment.apiUrl}/organizer/reservations/${id}/cancel`, {});
  }

  lookupReservations(phone: string, slug: string) {
    return this.http.get<ParticipantLookupResult>(`${environment.apiUrl}/public/reservations/lookup`, {
      params: { phone, slug }
    });
  }
}
