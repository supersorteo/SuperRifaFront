import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreateReservationRequest, ReservationResponse } from '../models/reservation.models';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);

  create(req: CreateReservationRequest) {
    return this.http.post<ReservationResponse>(`${environment.apiUrl}/public/reservations`, req);
  }
}
