import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CreateRaffleRequest,
  NumberInfo,
  RaffleListItem,
  RafflePublicResponse,
} from '../models/raffle.models';

@Injectable({ providedIn: 'root' })
export class RaffleService {
  private readonly http = inject(HttpClient);

  getPublic(slug: string) {
    return this.http.get<RafflePublicResponse>(`${environment.apiUrl}/public/raffles/${slug}`);
  }

  getNumbers(slug: string) {
    return this.http.get<NumberInfo[]>(`${environment.apiUrl}/public/raffles/${slug}/numbers`);
  }

  getMyRaffles() {
    return this.http.get<RaffleListItem[]>(`${environment.apiUrl}/organizer/raffles`);
  }

  create(req: CreateRaffleRequest) {
    return this.http.post<RaffleListItem>(`${environment.apiUrl}/organizer/raffles`, req);
  }

  publish(id: string) {
    return this.http.post<RaffleListItem>(`${environment.apiUrl}/organizer/raffles/${id}/publish`, {});
  }

  pause(id: string) {
    return this.http.post<RaffleListItem>(`${environment.apiUrl}/organizer/raffles/${id}/pause`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/organizer/raffles/${id}`);
  }

  executeDraw(id: string) {
    return this.http.post<unknown>(`${environment.apiUrl}/organizer/raffles/${id}/draw/execute`, {});
  }

  uploadImages(id: string, files: File[]) {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f, f.name));
    return this.http.post<void>(`${environment.apiUrl}/organizer/raffles/${id}/images`, fd);
  }
}
