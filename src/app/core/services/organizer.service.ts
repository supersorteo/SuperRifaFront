import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  OrganizerProfile,
  PaymentMethod,
  PaymentMethodRequest,
  UpdateProfileRequest
} from '../models/organizer.models';

@Injectable({ providedIn: 'root' })
export class OrganizerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/organizer`;

  getProfile() {
    return this.http.get<OrganizerProfile>(`${this.base}/profile`);
  }

  updateProfile(req: UpdateProfileRequest) {
    return this.http.put<OrganizerProfile>(`${this.base}/profile`, req);
  }

  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<OrganizerProfile>(`${this.base}/profile/avatar`, form);
  }

  getPaymentMethods() {
    return this.http.get<PaymentMethod[]>(`${this.base}/payment-methods`);
  }

  createPaymentMethod(req: PaymentMethodRequest) {
    return this.http.post<PaymentMethod>(`${this.base}/payment-methods`, req);
  }

  updatePaymentMethod(id: string, req: PaymentMethodRequest) {
    return this.http.put<PaymentMethod>(`${this.base}/payment-methods/${id}`, req);
  }

  deletePaymentMethod(id: string) {
    return this.http.delete<void>(`${this.base}/payment-methods/${id}`);
  }
}
