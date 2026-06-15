import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListItem } from '../../../core/models/raffle.models';
import { RaffleFormModal } from '../raffle-form-modal/raffle-form-modal';
import { RaffleActionsMenu } from '../raffle-actions-menu/raffle-actions-menu';
import { LiveDrawOverlay } from '../../../shared/components/live-draw-overlay/live-draw-overlay';
import { WinnerReservationModal } from '../../../shared/components/winner-reservation-modal/winner-reservation-modal';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, CurrencyArPipe, RaffleFormModal, RaffleActionsMenu, LiveDrawOverlay, WinnerReservationModal],
  host: { '(document:click)': 'closeAllMenus()' },
  template: `
    <app-live-draw-overlay
      [open]="liveDrawOpen()"
      [title]="liveDrawRaffle()?.title || 'Sorteo en curso'"
      [subtitle]="liveDrawWinner() === null ? 'El sorteo se esta ejecutando en tiempo real.' : 'El ganador ya fue definido.'"
      [countdown]="liveDrawCountdown()"
      [winnerNumber]="liveDrawWinner()"
      [winnerName]="liveDrawWinnerName()" />

    <app-winner-reservation-modal
      [open]="winnerModalOpen()"
      [raffleId]="winnerModalRaffle()?.id || ''"
      [raffleSlug]="winnerModalRaffle()?.slug || ''"
      [winnerName]="winnerModalRaffle()?.winnerName || ''"
      [winnerPhone]="winnerModalRaffle()?.winnerPhone || ''"
      (closed)="winnerModalOpen.set(false)" />

    <app-raffle-form-modal
      [open]="showModal()"
      (closed)="showModal.set(false)"
      (created)="onRaffleCreated()" />

    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-1">
          Hola, {{ firstName() }} <span style="font-style:normal">👋</span>
        </h2>
        <p class="text-muted mb-0">Aqui esta el resumen de tu actividad</p>
      </div>
      <button class="btn btn-gradient fw-semibold px-4 rounded-3" (click)="showModal.set(true)">
        <i class="bi bi-plus-circle-fill me-2"></i>Nueva Rifa
      </button>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-6 col-xl-3">
        <div class="stat-card stat-card--indigo d-flex justify-content-between align-items-start">
          <div>
            <div class="stat-card__value">{{ raffles().length }}</div>
            <div class="stat-card__label">Total rifas</div>
          </div>
          <i class="bi bi-ticket stat-card__icon"></i>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card stat-card--emerald d-flex justify-content-between align-items-start">
          <div>
            <div class="stat-card__value">{{ activeCount() }}</div>
            <div class="stat-card__label">Publicadas</div>
          </div>
          <i class="bi bi-check-circle-fill stat-card__icon"></i>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card stat-card--amber d-flex justify-content-between align-items-start">
          <div>
            <div class="stat-card__value">{{ draftCount() }}</div>
            <div class="stat-card__label">Borradores</div>
          </div>
          <i class="bi bi-file-earmark-text stat-card__icon"></i>
        </div>
      </div>
      <div class="col-6 col-xl-3">
        <div class="stat-card stat-card--pink d-flex justify-content-between align-items-start">
          <div>
            <div class="stat-card__value">{{ finishedCount() }}</div>
            <div class="stat-card__label">Finalizadas</div>
          </div>
          <i class="bi bi-trophy-fill stat-card__icon"></i>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <div>
          <h6 class="fw-bold mb-0">Rifas recientes</h6>
          <p class="text-muted small mb-0">Ultimas {{ recentRaffles().length }} rifas</p>
        </div>
        <a routerLink="/dashboard/rifas" class="btn btn-sm btn-outline-primary rounded-3 px-3">
          Ver todas <i class="bi bi-arrow-right ms-1"></i>
        </a>
      </div>
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="width:2rem;height:2rem">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        } @else if (recentRaffles().length === 0) {
          <div class="text-center py-5">
            <i class="bi bi-ticket-perforated text-muted" style="font-size:3rem"></i>
            <p class="text-muted mt-3 mb-3">Todavia no tenes rifas</p>
            <button class="btn btn-gradient btn-sm px-4 rounded-3" (click)="showModal.set(true)">
              <i class="bi bi-plus-circle me-1"></i>Crear mi primera rifa
            </button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Rifa</th>
                  <th>Estado</th>
                  <th class="d-none d-md-table-cell">Numeros</th>
                  <th class="d-none d-md-table-cell">Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (r of recentRaffles(); track r.id) {
                  <tr>
                    <td class="ps-4">
                      <div class="fw-semibold">{{ r.title }}</div>
                      @if (r.drawDateTime) {
                        <div class="small text-muted">
                          <i class="bi bi-calendar3 me-1"></i>{{ formatDate(r.drawDateTime) }}
                        </div>
                      }
                      @if (r.winnerName) {
                        <button type="button" class="btn btn-link p-0 small text-decoration-none text-start text-muted mt-1"
                                (click)="openWinnerDetails($event, r)">
                          <i class="bi bi-trophy-fill text-warning me-1"></i>{{ r.winnerName }}
                          @if (r.winnerPhone) { <span>· {{ r.winnerPhone }}</span> }
                        </button>
                      }
                    </td>
                    <td>
                      <span class="badge rounded-pill fw-semibold" [class]="pubBadgeCls(r.publicationStatus)">
                        {{ pubLabel(r.publicationStatus) }}
                      </span>
                    </td>
                    <td class="d-none d-md-table-cell text-muted small">{{ r.totalNumbers }}</td>
                    <td class="d-none d-md-table-cell text-muted small">{{ r.pricePerNumber | currencyAr }}</td>
                    <td class="text-end pe-3">
                      <div class="d-flex align-items-center justify-content-end gap-1">
                        <a [routerLink]="['/rifa', r.slug]" target="_blank"
                           class="btn btn-sm btn-outline-secondary rounded-3 px-2"
                           aria-label="Ver rifa publica">
                          <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                        <app-raffle-actions-menu
                          [raffle]="r"
                          [isOpen]="openMenuId() === r.id"
                          (toggled)="toggleMenu($event, r.id)"
                          (changed)="onRaffleChanged($event)"
                          (deleted)="onRaffleDeleted($event)"
                          (drawRequested)="onDrawRequested($event)"
                          (drawFailed)="onDrawFailed($event)"
                          (drawExecuted)="load()" />
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardHome implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly raffleService = inject(RaffleService);
  private readonly ws = inject(WebSocketService);
  private drawSubs: Subscription[] = [];
  private activeDrawRaffleId: string | null = null;

  protected readonly loading = signal(true);
  protected readonly raffles = signal<RaffleListItem[]>([]);
  protected readonly showModal = signal(false);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly liveDrawOpen = signal(false);
  protected readonly liveDrawRaffle = signal<RaffleListItem | null>(null);
  protected readonly liveDrawCountdown = signal<number | null>(null);
  protected readonly liveDrawWinner = signal<number | null>(null);
  protected readonly liveDrawWinnerName = signal('');
  protected readonly winnerModalOpen = signal(false);
  protected readonly winnerModalRaffle = signal<RaffleListItem | null>(null);

  protected readonly firstName = computed(() => {
    const parts = this.auth.orgUser()?.fullName?.split(' ') ?? [];
    return parts.length > 0 ? parts[0] : 'organizador';
  });
  protected readonly activeCount = computed(() => this.raffles().filter(r => r.publicationStatus === 'PUBLISHED').length);
  protected readonly draftCount = computed(() => this.raffles().filter(r => r.publicationStatus === 'DRAFT').length);
  protected readonly finishedCount = computed(() => this.raffles().filter(r => r.operationalStatus === 'FINISHED').length);
  protected readonly recentRaffles = computed(() => this.raffles().slice(0, 5));

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.cleanupDrawSubscriptions();
    this.ws.disconnect();
  }

  protected load(): void {
    this.raffleService.getMyRaffles().subscribe({
      next: raffles => {
        this.raffles.set(raffles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onRaffleCreated(): void {
    this.load();
  }

  protected closeAllMenus(): void {
    this.openMenuId.set(null);
  }

  protected toggleMenu(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.openMenuId.update(curr => curr === id ? null : id);
  }

  protected onRaffleChanged(updated: RaffleListItem): void {
    this.openMenuId.set(null);
    this.raffles.update(list => list.map(x => x.id === updated.id ? updated : x));
  }

  protected onRaffleDeleted(id: string): void {
    this.openMenuId.set(null);
    this.raffles.update(list => list.filter(x => x.id !== id));
  }

  protected onDrawRequested(raffle: RaffleListItem): void {
    this.openMenuId.set(null);
    this.liveDrawOpen.set(true);
    this.liveDrawRaffle.set(raffle);
    this.liveDrawCountdown.set(5);
    this.liveDrawWinner.set(null);
    this.liveDrawWinnerName.set('');
    this.subscribeToLiveDraw(raffle);
  }

  protected onDrawFailed(message: string): void {
    this.liveDrawOpen.set(false);
    this.liveDrawRaffle.set(null);
    this.liveDrawCountdown.set(null);
    this.liveDrawWinner.set(null);
    this.liveDrawWinnerName.set('');
    this.cleanupDrawSubscriptions();
    alert(message);
  }

  protected openWinnerDetails(event: MouseEvent, raffle: RaffleListItem): void {
    event.stopPropagation();
    if (!raffle.winnerPhone) return;
    this.winnerModalRaffle.set(raffle);
    this.winnerModalOpen.set(true);
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected pubBadgeCls(s: string): string {
    return {
      DRAFT: 'bg-secondary text-white',
      PUBLISHED: 'bg-success text-white',
      PAUSED: 'bg-warning text-dark',
      CLOSED: 'bg-dark text-white',
    }[s] ?? 'bg-secondary text-white';
  }

  protected pubLabel(s: string): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada' }[s] ?? s;
  }

  private subscribeToLiveDraw(raffle: RaffleListItem): void {
    if (this.activeDrawRaffleId === raffle.id) return;

    this.cleanupDrawSubscriptions();
    this.activeDrawRaffleId = raffle.id;

    this.ws.connect().then(() => {
      this.drawSubs = [
        this.ws.subscribe<{ status: string }>(`/topic/raffle/${raffle.id}/status`).subscribe(evt => {
          if (evt.status === 'FAILED') {
            this.liveDrawOpen.set(false);
            this.liveDrawRaffle.set(null);
            this.liveDrawCountdown.set(null);
            this.liveDrawWinner.set(null);
            this.liveDrawWinnerName.set('');
            this.cleanupDrawSubscriptions();
            this.load();
          }
        }),
        this.ws.subscribe<{ secondsRemaining: number }>(`/topic/raffle/${raffle.id}/countdown`).subscribe(evt => {
          this.liveDrawOpen.set(true);
          this.liveDrawCountdown.set(evt.secondsRemaining);
        }),
        this.ws.subscribe<{ winnerNumber: number; winnerName?: string; winnerPhone?: string }>(`/topic/raffle/${raffle.id}/result`).subscribe(evt => {
          this.liveDrawCountdown.set(null);
          this.liveDrawWinner.set(evt.winnerNumber);
          this.liveDrawWinnerName.set(evt.winnerName || '');
          this.raffles.update(list => list.map(item =>
            item.id === raffle.id ? {
              ...item,
              operationalStatus: 'FINISHED',
              winnerNumber: evt.winnerNumber,
              winnerName: evt.winnerName || item.winnerName,
              winnerPhone: evt.winnerPhone || item.winnerPhone
            } : item
          ));
          setTimeout(() => {
            this.liveDrawOpen.set(false);
            this.liveDrawRaffle.set(null);
            this.liveDrawWinner.set(null);
            this.liveDrawWinnerName.set('');
            this.cleanupDrawSubscriptions();
            this.load();
          }, 3200);
        }),
      ];
    }).catch(() => {
      this.liveDrawOpen.set(false);
      this.liveDrawRaffle.set(null);
      this.liveDrawCountdown.set(null);
      this.liveDrawWinner.set(null);
      this.liveDrawWinnerName.set('');
      this.cleanupDrawSubscriptions();
    });
  }

  private cleanupDrawSubscriptions(): void {
    for (const sub of this.drawSubs) {
      sub.unsubscribe();
    }
    this.drawSubs = [];

    if (this.activeDrawRaffleId) {
      this.ws.unsubscribe(`/topic/raffle/${this.activeDrawRaffleId}/status`);
      this.ws.unsubscribe(`/topic/raffle/${this.activeDrawRaffleId}/countdown`);
      this.ws.unsubscribe(`/topic/raffle/${this.activeDrawRaffleId}/result`);
    }

    this.activeDrawRaffleId = null;
  }
}
