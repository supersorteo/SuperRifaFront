import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { OrganizerReservation, ReservationStatus } from '../../../core/models/reservation.models';
import { RaffleListItem } from '../../../core/models/raffle.models';

type StatusFilter = ReservationStatus | 'ALL';

@Component({
  selector: 'app-reservations-dashboard',
  imports: [CurrencyArPipe],
  template: `
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-1">Reservas</h2>
        <p class="text-muted mb-0">Gestión de reservas de tus rifas</p>
      </div>
      <div class="text-muted small">
        <span class="badge bg-primary rounded-pill">{{ total() }}</span> reservas encontradas
      </div>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body py-3">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Filtrar por rifa</label>
            <select class="form-select form-select-sm" [value]="selectedRaffleId() || ''" (change)="onRaffleChange($event)">
              <option value="">Todas las rifas</option>
              @for (r of raffles(); track r.id) {
                <option [value]="r.id">{{ r.title }}</option>
              }
            </select>
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Teléfono</label>
            <input class="form-control form-control-sm"
                   type="text"
                   placeholder="Filtrar por teléfono"
                   [value]="phoneFilter()"
                   (change)="onPhoneChange($event)">
          </div>
          <div class="col-12 col-md-5">
            <label class="form-label small fw-semibold text-muted mb-1">Estado</label>
            <div class="d-flex flex-wrap gap-2">
              @for (s of statusOptions; track s.value) {
                <button
                  class="btn btn-sm rounded-pill px-3"
                  [class]="statusFilter() === s.value ? 'btn-primary' : 'btn-outline-secondary'"
                  (click)="setStatus(s.value)">
                  {{ s.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width:2rem;height:2rem">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        } @else if (reservations().length === 0) {
          <div class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size:3rem"></i>
            <p class="text-muted mt-3 mb-0">No hay reservas con los filtros seleccionados</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Participante</th>
                  <th class="d-none d-md-table-cell">Rifa</th>
                  <th>Números</th>
                  <th class="d-none d-sm-table-cell">Total</th>
                  <th>Estado</th>
                  <th class="d-none d-lg-table-cell">Fecha</th>
                  <th class="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reservations(); track r.id) {
                  <tr>
                    <td class="ps-4">
                      <div class="fw-semibold">{{ r.participantName }}</div>
                      <div class="small text-muted">
                        <i class="bi bi-telephone me-1"></i>{{ r.participantPhone }}
                      </div>
                      @if (r.participantEmail) {
                        <div class="small text-muted">{{ r.participantEmail }}</div>
                      }
                    </td>
                    <td class="d-none d-md-table-cell">
                      <span class="small text-muted">{{ r.raffleTitle }}</span>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1" style="max-width:180px">
                        @for (n of r.numbers; track n) {
                          <span class="badge rounded-pill" style="background:#e0e7ff;color:#3730a3;font-size:.72rem">{{ n }}</span>
                        }
                      </div>
                    </td>
                    <td class="d-none d-sm-table-cell fw-semibold text-success">
                      {{ r.totalAmount | currencyAr }}
                    </td>
                    <td>
                      <span class="badge rounded-pill fw-semibold" [class]="statusCls(r.status)">
                        {{ statusLabel(r.status) }}
                      </span>
                    </td>
                    <td class="d-none d-lg-table-cell small text-muted">
                      {{ formatDate(r.createdAt) }}
                      @if (r.status === 'PENDING' && r.expiresAt) {
                        <div class="text-warning" style="font-size:.7rem">
                          <i class="bi bi-clock me-1"></i>Vence {{ formatDate(r.expiresAt) }}
                        </div>
                      }
                    </td>
                    <td class="text-end pe-3">
                      <div class="d-flex justify-content-end gap-1">
                        @if (r.status === 'PENDING') {
                          <button
                            class="btn btn-sm btn-success rounded-3 px-2"
                            [disabled]="actionLoading() === r.id"
                            (click)="confirm(r)"
                            title="Confirmar pago">
                            @if (actionLoading() === r.id) {
                              <span class="spinner-border spinner-border-sm" role="status"></span>
                            } @else {
                              <i class="bi bi-check-lg"></i>
                            }
                          </button>
                          <button
                            class="btn btn-sm btn-outline-danger rounded-3 px-2"
                            [disabled]="actionLoading() === r.id"
                            (click)="cancel(r)"
                            title="Cancelar reserva">
                            <i class="bi bi-x-lg"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="d-flex justify-content-center align-items-center gap-2 py-3 border-top">
              <button class="btn btn-sm btn-outline-secondary rounded-3"
                      [disabled]="page() === 0"
                      (click)="prevPage()">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="small text-muted">Pág. {{ page() + 1 }} / {{ totalPages() }}</span>
              <button class="btn btn-sm btn-outline-secondary rounded-3"
                      [disabled]="page() + 1 >= totalPages()"
                      (click)="nextPage()">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ReservationsDashboard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservationService = inject(ReservationService);
  private readonly raffleService = inject(RaffleService);

  protected readonly loading      = signal(true);
  protected readonly reservations = signal<OrganizerReservation[]>([]);
  protected readonly raffles      = signal<RaffleListItem[]>([]);
  protected readonly total        = signal(0);
  protected readonly totalPages   = signal(0);
  protected readonly page         = signal(0);
  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly actionLoading = signal<string | null>(null);
  protected readonly phoneFilter = signal('');

  protected readonly selectedRaffleId = signal<string | undefined>(undefined);

  protected readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL',       label: 'Todas' },
    { value: 'PENDING',   label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
    { value: 'EXPIRED',   label: 'Expiradas' },
  ];

  ngOnInit(): void {
    this.raffleService.getMyRaffles().subscribe(r => this.raffles.set(r));
    this.route.queryParamMap.subscribe(params => {
      this.selectedRaffleId.set(params.get('raffleId') || undefined);
      this.phoneFilter.set(params.get('phone') || '');
      this.page.set(0);
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    const sf = this.statusFilter();
    const status: ReservationStatus | undefined = sf === 'ALL' ? undefined : sf;
    this.reservationService
      .listOrganizerReservations(this.selectedRaffleId(), this.phoneFilter(), status, this.page())
      .subscribe({
        next: res => {
          this.reservations.set(res.content);
          this.total.set(res.totalElements);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected setStatus(s: StatusFilter): void {
    this.statusFilter.set(s);
    this.page.set(0);
    this.load();
  }

  protected onRaffleChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.selectedRaffleId.set(val || undefined);
    this.page.set(0);
    this.syncQueryParams();
    this.load();
  }

  protected onPhoneChange(e: Event): void {
    this.phoneFilter.set((e.target as HTMLInputElement).value.trim());
    this.page.set(0);
    this.syncQueryParams();
    this.load();
  }

  protected confirm(r: OrganizerReservation): void {
    this.actionLoading.set(r.id);
    this.reservationService.confirmReservation(r.id).subscribe({
      next: updated => {
        this.reservations.update(list => list.map(x => x.id === r.id ? updated : x));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  protected cancel(r: OrganizerReservation): void {
    this.actionLoading.set(r.id);
    this.reservationService.cancelReservation(r.id).subscribe({
      next: updated => {
        this.reservations.update(list => list.map(x => x.id === r.id ? updated : x));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  protected prevPage(): void { this.page.update(p => p - 1); this.load(); }
  protected nextPage(): void { this.page.update(p => p + 1); this.load(); }

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        raffleId: this.selectedRaffleId() || null,
        phone: this.phoneFilter() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  protected statusCls(s: ReservationStatus): string {
    return ({
      PENDING:   'bg-warning text-dark',
      CONFIRMED: 'bg-success text-white',
      CANCELLED: 'bg-danger text-white',
      EXPIRED:   'bg-secondary text-white',
    })[s] ?? 'bg-secondary text-white';
  }

  protected statusLabel(s: ReservationStatus): string {
    return ({ PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', EXPIRED: 'Expirada' })[s] ?? s;
  }
}
