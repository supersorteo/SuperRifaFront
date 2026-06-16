import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { ParticipantLookupResult, ReservationStatus } from '../../../core/models/reservation.models';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-my-numbers',
  imports: [FormsModule, RouterLink, CurrencyArPipe, StatusBadge],
  template: `
    <div class="container py-5" style="max-width:680px">
      <div class="text-center mb-5">
        <div class="mb-3">
          <i class="bi bi-ticket-perforated-fill text-primary" style="font-size:3rem"></i>
        </div>
        <h1 class="fw-black mb-1">Mis números</h1>
        <p class="text-muted">Consultá el estado de tus reservas ingresando tu teléfono</p>
      </div>

      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <form (ngSubmit)="search()" #f="ngForm">
            <div class="mb-3">
              <label class="form-label fw-semibold">Número de teléfono</label>
              <input class="form-control form-control-lg" type="tel"
                     [(ngModel)]="phone" name="phone"
                     placeholder="+54 9 11 1234-5678"
                     required autocomplete="tel">
            </div>
            @if (!slugFromUrl()) {
              <div class="mb-3">
                <label class="form-label fw-semibold">Slug de la rifa</label>
                <input class="form-control" [(ngModel)]="slug" name="slug"
                       placeholder="nombre-de-la-rifa" required>
              </div>
            } @else {
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted small">Rifa</label>
                <div class="form-control bg-light text-muted">{{ slug }}</div>
              </div>
            }
            <button type="submit" class="btn btn-gradient fw-semibold w-100 rounded-3"
                    [disabled]="loading() || !phone || !slug">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>Buscando...
              } @else {
                <i class="bi bi-search me-2"></i>Consultar mis reservas
              }
            </button>
          </form>
        </div>
      </div>

      @if (notFound()) {
        <div class="alert alert-warning d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          No encontramos reservas para ese teléfono en esta rifa. Verificá el número ingresado.
        </div>
      }

      @if (result()) {
        <div class="mb-3">
          <h5 class="fw-bold mb-0">
            <i class="bi bi-person-circle me-2 text-primary"></i>{{ result()!.participantName }}
          </h5>
          <p class="text-muted small mb-0">Rifa: <strong>{{ result()!.raffleTitle }}</strong></p>
        </div>

        @for (r of result()!.reservations; track r.id) {
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <app-status-badge category="reservation" [value]="r.status" [label]="reservationLabel(r.status)"></app-status-badge>
                </div>
                <div class="text-end">
                  <div class="fw-bold text-success">{{ r.totalAmount | currencyAr }}</div>
                  <div class="text-muted small">{{ r.numbers.length }} número{{ r.numbers.length !== 1 ? 's' : '' }}</div>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 mb-3">
                @for (n of r.numbers; track n) {
                  <span class="badge rounded-pill fw-bold px-3 py-2"
                        style="background:#e0e7ff;color:#3730a3;font-size:.9rem">
                    {{ n }}
                  </span>
                }
              </div>

              <div class="text-muted small">
                <i class="bi bi-calendar3 me-1"></i>Reservado el {{ formatDate(r.createdAt) }}
                @if (r.status === 'PENDING' && r.expiresAt) {
                  · <span class="text-warning fw-semibold">
                    <i class="bi bi-clock me-1"></i>Vence el {{ formatDate(r.expiresAt) }}
                  </span>
                }
              </div>

              @if (r.status === 'PENDING') {
                <div class="alert alert-info mt-3 mb-0 py-2 small">
                  <i class="bi bi-info-circle-fill me-1"></i>
                  Tu reserva está pendiente de pago. Contactá al organizador para confirmarla.
                </div>
              }
            </div>
          </div>
        }

        <div class="text-center mt-4">
          <a [routerLink]="['/rifa', result()!.raffleSlug]" class="btn btn-outline-primary rounded-3">
            <i class="bi bi-arrow-left me-1"></i>Volver a la rifa
          </a>
        </div>
      }
    </div>
  `
})
export class MyNumbers implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);

  protected phone = '';
  protected slug = '';

  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly result = signal<ParticipantLookupResult | null>(null);
  protected readonly slugFromUrl = signal(false);

  ngOnInit(): void {
    const s = this.route.snapshot.queryParamMap.get('slug');
    if (s) {
      this.slug = s;
      this.slugFromUrl.set(true);
    }
  }

  protected search(): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.result.set(null);

    this.reservationService.lookupReservations(this.phone.trim(), this.slug.trim()).subscribe({
      next: r => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected reservationLabel(s: ReservationStatus): string {
    return ({
      PENDING: 'Pendiente de pago',
      CONFIRMED: 'Confirmada ✓',
      CANCELLED: 'Cancelada',
      EXPIRED: 'Expirada',
    })[s] ?? s;
  }
}
