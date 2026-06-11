import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminOrganizer, AdminOrganizerDetail } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getOrganizers() {
    return this.http.get<AdminOrganizer[]>(`${environment.apiUrl}/admin/organizers`);
  }

  getOrganizerDetail(id: string) {
    return this.http.get<AdminOrganizerDetail>(`${environment.apiUrl}/admin/organizers/${id}`);
  }

  deleteOrganizer(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/admin/organizers/${id}`);
  }

  deleteRaffle(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/admin/raffles/${id}`);
  }
}
