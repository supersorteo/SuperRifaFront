import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyArPipe } from '../../pipes/currency-ar.pipe';
import { ReservationService } from '../../../core/services/reservation.service';
import { ParticipantLookupResult, ReservationSummary } from '../../../core/models/reservation.models';

@Component({
  selector: 'app-winner-reservation-modal',
  standalone: true,
  imports: [CurrencyArPipe, RouterLink],
  template: `
    @if (open()) {
      <div class="modal-backdrop fade show" style="z-index:1050" (click)="close()"></div>

      <div class="modal d-block" style="z-index:1055;overflow-y:auto" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered modal-lg px-2">
          <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
            <div class="hero-gradient text-white px-4 py-4">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div class="small text-uppercase opacity-75 fw-semibold" style="letter-spacing:.1em">Ganador</div>
                  <h4 class="fw-black mb-1">{{ winnerName() || 'Detalle de reserva' }}</h4>
                  @if (winnerPhone()) {
                    <div class="opacity-75">{{ winnerPhone() }}</div>
                  }
                </div>
                <button type="button" class="btn btn-link text-white opacity-75 p-1" (click)="close()" aria-label="Cerrar">
                  <i class="bi bi-x-lg fs-5"></i>
                </button>
              </div>
            </div>

            <div class="p-4">
              @if (loading()) {
                <div class="text-center py-4">
                  <div class="spinner-border text-primary mb-3" role="status"></div>
                  <div class="text-muted small">Cargando detalle del ganador...</div>
                </div>
              } @else if (error()) {
                <div class="alert alert-danger mb-0">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error() }}
                </div>
              } @else if (lookup()) {
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                  <div>
                    <div class="text-muted small">Rifa</div>
                    <div class="fw-bold">{{ lookup()!.raffleTitle }}</div>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <a class="btn btn-sm btn-outline-primary rounded-3"
                       [href]="'/rifa/' + lookup()!.raffleSlug" target="_blank" rel="noopener noreferrer">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Ver rifa publica
                    </a>
                    <a class="btn btn-sm btn-outline-dark rounded-3"
                       [routerLink]="['/dashboard/reservas']"
                       [queryParams]="{ raffleId: raffleId() || null, phone: winnerPhone() || null }"
                       (click)="close()">
                      <i class="bi bi-collection me-1"></i>Ir a reservas
                    </a>
                  </div>
                </div>

                <div class="row g-3">
                  @for (reservation of lookup()!.reservations; track reservation.id) {
                    <div class="col-12">
                      <div class="border rounded-4 p-3 bg-light-subtle">
                        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                          <div>
                            <div class="small text-muted">Reserva</div>
                            <div class="fw-semibold">{{ reservation.id }}</div>
                          </div>
                          <span class="badge rounded-pill fw-semibold" [class]="statusCls(reservation.status)">
                            {{ statusLabel(reservation.status) }}
                          </span>
                        </div>

                        <div class="mb-3">
                          <div class="small text-muted mb-2">Numeros ganadores / reservados</div>
                          <div class="d-flex flex-wrap gap-2">
                            @for (num of reservation.numbers; track num) {
                              <span class="badge rounded-pill px-3 py-2"
                                    style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff">
                                {{ num }}
                              </span>
                            }
                          </div>
                        </div>

                        <div class="row g-3 small">
                          <div class="col-sm-4">
                            <div class="text-muted">Total</div>
                            <div class="fw-bold text-success">{{ reservation.totalAmount | currencyAr }}</div>
                          </div>
                          <div class="col-sm-4">
                            <div class="text-muted">Creada</div>
                            <div class="fw-semibold">{{ formatDate(reservation.createdAt) }}</div>
                          </div>
                          <div class="col-sm-4">
                            <div class="text-muted">Expira</div>
                            <div class="fw-semibold">{{ reservation.expiresAt ? formatDate(reservation.expiresAt) : 'No aplica' }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class WinnerReservationModal {
  readonly open = input.required<boolean>();
  readonly raffleId = input('');
  readonly raffleSlug = input('');
  readonly winnerName = input('');
  readonly winnerPhone = input('');
  readonly closed = output<void>();

  private readonly reservationService = inject(ReservationService);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly lookup = signal<ParticipantLookupResult | null>(null);

  constructor() {
    // no-op
  }

  ngOnChanges(): void {
    if (!this.open()) return;
    if (!this.raffleSlug() || !this.winnerPhone()) return;

    this.loading.set(true);
    this.error.set('');
    this.lookup.set(null);

    this.reservationService.lookupReservations(this.winnerPhone(), this.raffleSlug()).subscribe({
      next: result => {
        this.lookup.set(result);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message || 'No se pudo cargar el detalle del ganador');
        this.loading.set(false);
      },
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected statusCls(status: ReservationSummary['status']): string {
    return ({
      PENDING: 'bg-warning text-dark',
      CONFIRMED: 'bg-success text-white',
      CANCELLED: 'bg-danger text-white',
      EXPIRED: 'bg-secondary text-white',
    })[status] ?? 'bg-secondary text-white';
  }

  protected statusLabel(status: ReservationSummary['status']): string {
    return ({
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      EXPIRED: 'Expirada',
    })[status] ?? status;
  }
}
