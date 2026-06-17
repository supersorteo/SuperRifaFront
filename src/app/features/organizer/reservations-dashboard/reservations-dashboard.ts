import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { OrganizerReservation, ReservationStatus } from '../../../core/models/reservation.models';
import { RaffleListItem } from '../../../core/models/raffle.models';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialog, ConfirmDialogItem } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../core/services/notification.service';

type StatusFilter = ReservationStatus | 'ALL';
type ReservationAction = 'confirm' | 'cancel' | 'delete' | null;

@Component({
  selector: 'app-reservations-dashboard',
  imports: [CurrencyArPipe, StatusBadge, ConfirmDialog],
  template: `
    <app-confirm-dialog
      [open]="pendingAction() !== null && selectedReservation() !== null"
      [title]="pendingAction() === 'confirm' ? 'Confirmar reserva' : pendingAction() === 'cancel' ? 'Cancelar reserva' : 'Eliminar reserva'"
      [body]="dialogBody()"
      [icon]="pendingAction() === 'confirm' ? 'bi bi-check-circle-fill' : pendingAction() === 'delete' ? 'bi bi-trash-fill' : 'bi bi-x-circle-fill'"
      [tone]="pendingAction() === 'confirm' ? 'info' : 'danger'"
      [confirmLabel]="pendingAction() === 'confirm' ? 'Confirmar pago' : pendingAction() === 'cancel' ? 'Cancelar reserva' : 'Eliminar'"
      [busy]="actionLoading() === selectedReservation()?.id"
      [items]="pendingAction() === 'confirm' ? confirmItems() : pendingAction() === 'cancel' ? cancelItems() : deleteItems()"
      (cancelled)="closeDialog()"
      (confirmed)="pendingAction() === 'confirm' ? confirmSelected() : pendingAction() === 'cancel' ? cancelSelected() : deleteSelected()" />

    <!-- Header -->
    <div class="rd-header">
      <div class="rd-header__text">
        <h2 class="rd-title">Reservas</h2>
        <p class="rd-subtitle">Gestión en tiempo real</p>
      </div>
      <div class="rd-total-badge">
        <i class="bi bi-people-fill"></i>
        <span><strong>{{ total() }}</strong> reservas</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="rd-filters">
      <div class="rd-filters__inputs">
        <div class="rd-filter-field">
          <label class="rd-filter-label" for="rd-raffle-sel">Rifa</label>
          <select id="rd-raffle-sel" class="rd-select"
                  [value]="selectedRaffleId() || ''" (change)="onRaffleChange($event)">
            <option value="">Todas las rifas</option>
            @for (r of raffles(); track r.id) {
              <option [value]="r.id">{{ r.title }}</option>
            }
          </select>
        </div>

        <div class="rd-filter-field">
          <label class="rd-filter-label" for="rd-phone">Teléfono</label>
          <div class="rd-input-wrap">
            <i class="bi bi-telephone rd-input-icon"></i>
            <input id="rd-phone" type="text" class="rd-input rd-input--icon"
                   placeholder="Buscar por teléfono"
                   [value]="phoneFilter()" (change)="onPhoneChange($event)">
          </div>
        </div>
      </div>

      <div class="rd-status-pills">
        @for (s of statusOptions; track s.value) {
          <button class="rd-pill"
                  [class.rd-pill--active]="statusFilter() === s.value"
                  (click)="setStatus(s.value)">
            {{ s.label }}
          </button>
        }
      </div>
    </div>

    <!-- Table card -->
    <div class="rd-card">

      @if (expiringSoonCount() > 0 && !loading()) {
        <div class="rd-expiry-banner">
          <i class="bi bi-exclamation-triangle-fill rd-expiry-banner__icon"></i>
          <div>
            <strong>{{ expiringSoonCount() }} reserva{{ expiringSoonCount() > 1 ? 's' : '' }} por vencer</strong>
            — Confirmá el pago antes de que se liberen los números automáticamente.
          </div>
        </div>
      }

      @if (loading()) {
        <div class="rd-state-center">
          <div class="rd-spinner" role="status" aria-label="Cargando"></div>
          <p class="rd-state-text">Cargando reservas...</p>
        </div>
      }

      @else if (reservations().length === 0) {
        <div class="rd-empty">
          <div class="rd-empty__icon"><i class="bi bi-inbox-fill"></i></div>
          <div class="rd-empty__title">Sin resultados</div>
          <p class="rd-empty__sub">No hay reservas con los filtros aplicados.</p>
        </div>
      }

      @else {
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4">Participante</th>
                <th class="d-none d-md-table-cell">Rifa</th>
                <th>Números</th>
                <th class="d-none d-sm-table-cell">Total</th>
                <th>Estado</th>
                <th class="d-none d-lg-table-cell">Fecha</th>
                <th style="width:90px"></th>
              </tr>
            </thead>
            <tbody>
              @for (r of reservations(); track r.id) {
                <tr class="rd-row" [class.rd-row--expiring]="isExpiringSoon(r)">
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="rd-avatar" [style]="avatarStyle(r.participantName)">
                        {{ r.participantName.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="rd-participant-name">{{ r.participantName }}</div>
                        <div class="rd-participant-phone">
                          <i class="bi bi-telephone"></i>{{ r.participantPhone }}
                        </div>
                        @if (r.participantEmail) {
                          <div class="rd-participant-email">{{ r.participantEmail }}</div>
                        }
                      </div>
                    </div>
                  </td>

                  <td class="d-none d-md-table-cell">
                    <span class="rd-raffle-name">{{ r.raffleTitle }}</span>
                  </td>

                  <td>
                    <div class="rd-numbers">
                      @for (n of displayNums(r.numbers); track n) {
                        <span class="rd-num-badge">{{ n }}</span>
                      }
                      @if (r.numbers.length > 3) {
                        <span class="rd-num-badge rd-num-badge--more">+{{ r.numbers.length - 3 }}</span>
                      }
                    </div>
                  </td>

                  <td class="d-none d-sm-table-cell">
                    <span class="rd-amount">{{ r.totalAmount | currencyAr }}</span>
                  </td>

                  <td>
                    <app-status-badge category="reservation" [value]="r.status" />
                  </td>

                  <td class="d-none d-lg-table-cell">
                    <span class="rd-date">{{ formatDate(r.createdAt) }}</span>
                    @if (r.status === 'PENDING' && r.expiresAt) {
                      @if (isExpiringSoon(r)) {
                        <div class="rd-expires rd-expires--urgent">
                          <i class="bi bi-exclamation-triangle-fill"></i>{{ expiryLabel(r.expiresAt) }}
                        </div>
                      } @else {
                        <div class="rd-expires">
                          <i class="bi bi-clock"></i>Vence {{ formatDate(r.expiresAt) }}
                        </div>
                      }
                    }
                  </td>

                  <td class="pe-3">
                    <div class="d-flex justify-content-end gap-1">
                      @if (r.status === 'PENDING') {
                        <button class="rd-action-btn rd-action-btn--confirm"
                                [disabled]="actionLoading() === r.id"
                                (click)="confirm(r)"
                                title="Confirmar pago"
                                aria-label="Confirmar pago">
                          @if (actionLoading() === r.id) {
                            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                          } @else {
                            <i class="bi bi-check2"></i>
                          }
                        </button>
                        <button class="rd-action-btn rd-action-btn--cancel"
                                [disabled]="actionLoading() === r.id"
                                (click)="cancel(r)"
                                title="Cancelar reserva"
                                aria-label="Cancelar reserva">
                          <i class="bi bi-x-lg"></i>
                        </button>
                      }
                      <button class="rd-action-btn rd-action-btn--delete"
                              [disabled]="actionLoading() === r.id"
                              (click)="delete(r)"
                              title="Eliminar reserva"
                              aria-label="Eliminar reserva">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="rd-pagination">
            <button class="rd-page-btn"
                    [disabled]="page() === 0"
                    (click)="prevPage()"
                    aria-label="Página anterior">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span class="rd-page-info">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button class="rd-page-btn"
                    [disabled]="page() + 1 >= totalPages()"
                    (click)="nextPage()"
                    aria-label="Página siguiente">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    /* Header */
    .rd-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
    }
    .rd-title {
      font-size: 1.45rem; font-weight: 900; letter-spacing: -0.035em; color: #18181b; margin: 0;
    }
    .rd-subtitle { font-size: .875rem; color: #71717a; margin: .25rem 0 0; }
    .rd-total-badge {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .45rem .9rem; border-radius: 999px;
      background: #ede9fe; color: #6d28d9; font-size: .82rem; font-weight: 600;
      i { font-size: .85rem; }
    }

    /* Filters */
    .rd-filters {
      background: #fff; border: 1px solid rgba(99,102,241,.1);
      border-radius: 1.1rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
      box-shadow: 0 2px 12px rgba(99,102,241,.06);
      display: flex; flex-direction: column; gap: .85rem;
    }
    .rd-filters__inputs { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; }
    @media (max-width: 575px) { .rd-filters__inputs { grid-template-columns: 1fr; } }
    .rd-filter-field { display: flex; flex-direction: column; gap: .3rem; }
    .rd-filter-label { font-size: .78rem; font-weight: 700; color: #71717a; }
    .rd-select, .rd-input {
      width: 100%; padding: .55rem .85rem; font-size: .86rem;
      background: #fafaff; color: #18181b;
      border: 1.5px solid #e0e3ff; border-radius: .65rem; outline: none;
      transition: border-color .18s, box-shadow .18s;
      &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); background: #fff; }
    }
    .rd-input-wrap { position: relative; }
    .rd-input-icon {
      position: absolute; left: .85rem; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; font-size: .78rem; pointer-events: none;
    }
    .rd-input--icon { padding-left: 2rem; }

    /* Status pills */
    .rd-status-pills { display: flex; flex-wrap: wrap; gap: .4rem; }
    .rd-pill {
      padding: .3rem .85rem; border-radius: 999px; font-size: .78rem; font-weight: 700;
      border: 1.5px solid #e4e4e7; background: transparent; color: #71717a; cursor: pointer;
      transition: all .15s;
      &:hover { border-color: #c7d2fe; color: #4338ca; background: #eef2ff; }
      &--active { background: #6366f1; border-color: #6366f1; color: #fff; }
    }

    /* Table card */
    .rd-card {
      background: #fff; border-radius: 1.25rem;
      border: 1px solid rgba(99,102,241,.07);
      box-shadow: 0 4px 24px rgba(99,102,241,.08), 0 1px 4px rgba(0,0,0,.05);
      overflow: visible;
    }
    .rd-card .table-responsive { overflow: visible; }

    /* States */
    .rd-state-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 2rem;
    }
    .rd-spinner {
      width: 38px; height: 38px; border-radius: 50%;
      border: 3px solid rgba(99,102,241,.15); border-top-color: #6366f1;
      animation: spin-slow .8s linear infinite;
    }
    .rd-state-text { color: #a1a1aa; font-size: .85rem; margin: .9rem 0 0; }
    .rd-empty {
      padding: 4rem 2rem; text-align: center;
    }
    .rd-empty__icon {
      width: 72px; height: 72px; border-radius: 1.25rem; margin: 0 auto 1rem;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      border: 1px solid rgba(99,102,241,.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; color: #6366f1;
    }
    .rd-empty__title { font-size: 1.05rem; font-weight: 800; color: #18181b; margin-bottom: .4rem; }
    .rd-empty__sub   { color: #71717a; font-size: .86rem; max-width: 320px; margin: 0 auto; }

    /* Table head */
    thead tr th {
      font-size: .75rem; font-weight: 800; color: #71717a; text-transform: uppercase;
      letter-spacing: .07em; border-bottom: 1.5px solid #f0f0fb;
      background: #fafaff; padding-top: .75rem; padding-bottom: .75rem;
    }

    /* Expiry banner */
    .rd-expiry-banner {
      display: flex; align-items: flex-start; gap: .65rem;
      padding: .8rem 1.25rem; margin: 0;
      background: #fffbeb; border-bottom: 1px solid #fde68a;
      font-size: .83rem; color: #92400e; line-height: 1.5;
    }
    .rd-expiry-banner__icon { color: #d97706; font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

    /* Table rows */
    .rd-row {
      transition: background .12s;
      &:hover { background: #fafaff !important; }
      &--expiring { background: #fffbeb !important; }
      &--expiring:hover { background: #fef3c7 !important; }
    }

    /* Participant */
    .rd-avatar {
      width: 38px; height: 38px; border-radius: .7rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: .9rem; color: #fff;
    }
    .rd-participant-name { font-size: .88rem; font-weight: 700; color: #18181b; }
    .rd-participant-phone {
      font-size: .75rem; color: #71717a; display: flex; align-items: center; gap: .25rem; margin-top: .15rem;
      i { font-size: .68rem; }
    }
    .rd-participant-email { font-size: .72rem; color: #a1a1aa; margin-top: .1rem; }

    /* Raffle name */
    .rd-raffle-name { font-size: .82rem; color: #52525b; font-weight: 500; }

    /* Number badges */
    .rd-numbers { display: flex; flex-wrap: wrap; gap: .25rem; max-width: 160px; }
    .rd-num-badge {
      display: inline-block; padding: .15rem .45rem; border-radius: .4rem;
      background: #e0e7ff; color: #3730a3; font-size: .7rem; font-weight: 700;
      &--more { background: #f4f4f5; color: #71717a; }
    }

    /* Amount */
    .rd-amount { font-size: .88rem; font-weight: 700; color: #059669; }

    /* Date */
    .rd-date { font-size: .78rem; color: #71717a; }
    .rd-expires {
      display: flex; align-items: center; gap: .25rem;
      font-size: .7rem; color: #d97706; margin-top: .2rem;
      i { font-size: .65rem; }
      &--urgent {
        color: #dc2626; font-weight: 700;
        i { font-size: .68rem; }
      }
    }

    /* Action buttons */
    .rd-action-btn {
      width: 32px; height: 32px; border-radius: .5rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .88rem; cursor: pointer; border: none; transition: all .15s;
      &:disabled { opacity: .45; cursor: not-allowed; }
      &--confirm {
        background: #dcfce7; color: #15803d;
        &:not(:disabled):hover { background: #bbf7d0; color: #166534; }
      }
      &--cancel {
        background: #fff1f2; color: #be123c;
        &:not(:disabled):hover { background: #ffe4e6; color: #9f1239; }
      }
      &--delete {
        background: #fef2f2; color: #991b1b;
        &:not(:disabled):hover { background: #fee2e2; color: #7f1d1d; }
      }
    }

    /* Pagination */
    .rd-pagination {
      display: flex; align-items: center; justify-content: center; gap: .75rem;
      padding: .9rem 1.25rem; border-top: 1px solid #f0f0fb; background: #fafaff;
      border-radius: 0 0 1.25rem 1.25rem;
    }
    .rd-page-btn {
      width: 34px; height: 34px; border-radius: .55rem;
      background: #fff; border: 1.5px solid #e0e3ff; color: #6366f1;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem; cursor: pointer; transition: all .15s;
      &:disabled { opacity: .35; cursor: not-allowed; }
      &:not(:disabled):hover { background: #eef2ff; border-color: #a5b4fc; }
    }
    .rd-page-info { font-size: .82rem; font-weight: 700; color: #71717a; }
  `]
})
export class ReservationsDashboard implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservationService = inject(ReservationService);
  private readonly raffleService = inject(RaffleService);
  private readonly ws = inject(WebSocketService);
  private readonly notifications = inject(NotificationService);
  private readonly realtimeSubs = new Map<string, Subscription>();

  protected readonly loading = signal(true);
  protected readonly reservations = signal<OrganizerReservation[]>([]);
  protected readonly raffles = signal<RaffleListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly statusFilter = signal<StatusFilter>('ALL');
  protected readonly actionLoading = signal<string | null>(null);
  protected readonly phoneFilter = signal('');
  protected readonly pendingAction = signal<ReservationAction>(null);
  protected readonly selectedReservation = signal<OrganizerReservation | null>(null);
  protected readonly selectedRaffleId = signal<string | undefined>(undefined);

  protected readonly expiringSoonCount = computed(() =>
    this.reservations().filter(r => this.isExpiringSoon(r)).length
  );

  protected readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
    { value: 'EXPIRED', label: 'Expiradas' },
  ];

  ngOnInit(): void {
    this.raffleService.getMyRaffles().subscribe(raffles => {
      this.raffles.set(raffles);
      this.syncRealtimeSubscriptions(raffles);
    });

    this.route.queryParamMap.subscribe(params => {
      this.selectedRaffleId.set(params.get('raffleId') || undefined);
      this.phoneFilter.set(params.get('phone') || '');
      this.page.set(0);
      this.load();
    });
  }

  ngOnDestroy(): void {
    for (const [raffleId, sub] of this.realtimeSubs.entries()) {
      sub.unsubscribe();
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/progress`);
    }
    this.realtimeSubs.clear();
    this.ws.disconnect();
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

  protected setStatus(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(0);
    this.load();
  }

  protected onRaffleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRaffleId.set(value || undefined);
    this.page.set(0);
    this.syncQueryParams();
    this.load();
  }

  protected onPhoneChange(event: Event): void {
    this.phoneFilter.set((event.target as HTMLInputElement).value.trim());
    this.page.set(0);
    this.syncQueryParams();
    this.load();
  }

  protected confirm(reservation: OrganizerReservation): void {
    this.selectedReservation.set(reservation);
    this.pendingAction.set('confirm');
  }

  protected cancel(reservation: OrganizerReservation): void {
    this.selectedReservation.set(reservation);
    this.pendingAction.set('cancel');
  }

  protected delete(reservation: OrganizerReservation): void {
    this.selectedReservation.set(reservation);
    this.pendingAction.set('delete');
  }

  protected prevPage(): void {
    this.page.update(current => current - 1);
    this.load();
  }

  protected nextPage(): void {
    this.page.update(current => current + 1);
    this.load();
  }

  private syncRealtimeSubscriptions(raffles: RaffleListItem[]): void {
    const activeIds = new Set(raffles.map(raffle => raffle.id));

    for (const [raffleId, sub] of this.realtimeSubs.entries()) {
      if (activeIds.has(raffleId)) continue;
      sub.unsubscribe();
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/progress`);
      this.realtimeSubs.delete(raffleId);
    }

    this.ws.connect().then(() => {
      for (const raffle of raffles) {
        if (this.realtimeSubs.has(raffle.id)) continue;
        const sub = this.ws
          .subscribe<{ available: number; reserved: number; paid: number }>(`/topic/raffle/${raffle.id}/progress`)
          .subscribe(() => this.load());
        this.realtimeSubs.set(raffle.id, sub);
      }
    }).catch(() => {
      // Ignore realtime failures; manual reload still works.
    });
  }

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

  protected dialogBody(): string {
    const r = this.selectedReservation();
    if (!r) return '';
    if (this.pendingAction() === 'confirm')
      return `Se confirmará la reserva de ${r.participantName} en la rifa "${r.raffleTitle}".`;
    if (this.pendingAction() === 'delete')
      return `Se eliminará permanentemente la reserva de ${r.participantName}. Los números quedarán disponibles.`;
    return `Se cancelará la reserva de ${r.participantName} y sus números volverán a quedar disponibles.`;
  }

  protected avatarStyle(name: string): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#ec4899,#f43f5e)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#fbbf24,#f59e0b)',
      'linear-gradient(135deg,#22d3ee,#0891b2)',
      'linear-gradient(135deg,#8b5cf6,#6366f1)',
    ];
    return `background:${colors[name.charCodeAt(0) % colors.length]}`;
  }

  protected displayNums(numbers: number[]): number[] {
    return numbers.slice(0, 3);
  }

  protected isExpiringSoon(r: OrganizerReservation): boolean {
    if (r.status !== 'PENDING' || !r.expiresAt) return false;
    return (new Date(r.expiresAt).getTime() - Date.now()) < 2 * 60 * 60 * 1000;
  }

  protected expiryLabel(expiresAt: string): string {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Venció';
    const min = Math.floor(ms / 60000);
    if (min < 60) return `Vence en ${min} min`;
    const h = Math.floor(min / 60);
    return `Vence en ${h}h ${min % 60}min`;
  }

  protected formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected closeDialog(): void {
    this.pendingAction.set(null);
    this.selectedReservation.set(null);
    this.actionLoading.set(null);
  }

  protected confirmItems(): ConfirmDialogItem[] {
    const reservation = this.selectedReservation();
    if (!reservation) return [];

    return [
      { icon: 'bi bi-hash', color: '#818cf8', text: `Numeros: ${reservation.numbers.join(', ')}` },
      { icon: 'bi bi-cash-stack', color: '#10b981', text: `Total: ${reservation.totalAmount}` },
      { icon: 'bi bi-check2-all', color: '#06b6d4', text: 'La reserva pasara a confirmada' },
    ];
  }

  protected cancelItems(): ConfirmDialogItem[] {
    const reservation = this.selectedReservation();
    if (!reservation) return [];

    return [
      { icon: 'bi bi-hash', color: '#f59e0b', text: `Numeros: ${reservation.numbers.join(', ')}` },
      { icon: 'bi bi-unlock-fill', color: '#f87171', text: 'Los numeros volveran a estar disponibles' },
      { icon: 'bi bi-archive-fill', color: '#94a3b8', text: 'La reserva quedara cancelada' },
    ];
  }

  protected deleteItems(): ConfirmDialogItem[] {
    const reservation = this.selectedReservation();
    if (!reservation) return [];

    return [
      { icon: 'bi bi-person-fill', color: '#6366f1', text: reservation.participantName },
      { icon: 'bi bi-hash', color: '#f59e0b', text: `Numeros: ${reservation.numbers.join(', ')}` },
      { icon: 'bi bi-exclamation-triangle-fill', color: '#dc2626', text: 'Esta accion no se puede deshacer' },
    ];
  }

  protected confirmSelected(): void {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    this.actionLoading.set(reservation.id);
    this.reservationService.confirmReservation(reservation.id).subscribe({
      next: updated => {
        this.reservations.update(list => list.map(item => item.id === reservation.id ? updated : item));
        this.notifications.success('Reserva confirmada', `Se confirmo la reserva de ${reservation.participantName}.`);
        this.closeDialog();
      },
      error: () => {
        this.actionLoading.set(null);
        this.notifications.error('No se pudo confirmar la reserva');
      },
    });
  }

  protected cancelSelected(): void {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    this.actionLoading.set(reservation.id);
    this.reservationService.cancelReservation(reservation.id).subscribe({
      next: updated => {
        this.reservations.update(list => list.map(item => item.id === reservation.id ? updated : item));
        this.notifications.success('Reserva cancelada', `Se cancelo la reserva de ${reservation.participantName}.`);
        this.closeDialog();
      },
      error: () => {
        this.actionLoading.set(null);
        this.notifications.error('No se pudo cancelar la reserva');
      },
    });
  }

  protected deleteSelected(): void {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    this.actionLoading.set(reservation.id);
    this.reservationService.deleteReservation(reservation.id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(item => item.id !== reservation.id));
        this.total.update(t => t - 1);
        this.notifications.success('Reserva eliminada', `Se elimino la reserva de ${reservation.participantName}.`);
        this.closeDialog();
      },
      error: () => {
        this.actionLoading.set(null);
        this.notifications.error('No se pudo eliminar la reserva');
      },
    });
  }
}
