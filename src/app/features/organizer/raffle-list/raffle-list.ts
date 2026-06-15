import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListImage, RaffleListItem } from '../../../core/models/raffle.models';
import { RaffleFormModal } from '../raffle-form-modal/raffle-form-modal';
import { RaffleActionsMenu } from '../raffle-actions-menu/raffle-actions-menu';
import { LiveDrawOverlay } from '../../../shared/components/live-draw-overlay/live-draw-overlay';
import { WinnerReservationModal } from '../../../shared/components/winner-reservation-modal/winner-reservation-modal';

@Component({
  selector: 'app-raffle-list',
  imports: [RouterLink, CurrencyArPipe, RaffleFormModal, RaffleActionsMenu, LiveDrawOverlay, WinnerReservationModal],
  host: { '(document:click)': 'closeAllMenus()' },
  template: `
    <app-live-draw-overlay
      [open]="liveDrawOpen()"
      [title]="liveDrawRaffle()?.title || 'Sorteo en curso'"
      [subtitle]="liveDrawWinner() === null ? 'El ganador se esta definiendo en tiempo real para todos los participantes.' : 'El sorteo finalizo correctamente.'"
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
        <h2 class="fw-black mb-0">Mis Rifas</h2>
        <p class="text-muted small mb-0">Gestiona todas tus rifas desde aqui</p>
      </div>
      <button class="btn btn-gradient fw-semibold px-4 rounded-3" (click)="showModal.set(true)">
        <i class="bi bi-plus-circle-fill me-2"></i>Nueva Rifa
      </button>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center align-items-center" style="min-height:240px">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status" style="width:2.5rem;height:2.5rem">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="text-muted small">Cargando rifas...</p>
        </div>
      </div>
    }

    @if (!loading() && raffles().length === 0) {
      <div class="card border-0 shadow-sm text-center" style="padding:4rem 2rem">
        <div class="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-4"
             style="width:80px;height:80px;background:linear-gradient(135deg,#ede9fe,#fce7f3)">
          <i class="bi bi-ticket-perforated" style="font-size:2.2rem;color:#4f46e5"></i>
        </div>
        <h4 class="fw-bold mb-2">Todavia no tenes rifas</h4>
        <p class="text-muted mb-4">Crea tu primera rifa y empieza a vender numeros hoy mismo</p>
        <div>
          <button class="btn btn-gradient fw-semibold px-5 rounded-3" (click)="showModal.set(true)">
            <i class="bi bi-plus-circle-fill me-2"></i>Crear mi primera rifa
          </button>
        </div>
      </div>
    }

    @if (!loading() && raffles().length > 0) {
      <div class="row g-4">
        @for (r of raffles(); track r.id) {
          <div class="col-md-6 col-xl-4">
            <div class="card border-0 shadow-sm h-100 card-hover raffle-card-shell" [class.raffle-card-shell--finished]="r.operationalStatus === 'FINISHED'">
              <div class="raffle-card-header" [style.background]="cardHeaderGradient(r)">
                <div class="raffle-card-header__content">
                  <h5 class="raffle-card-header__title" [title]="r.title">{{ r.title }}</h5>
                  <div class="raffle-price-chip">{{ r.pricePerNumber | currencyAr }}</div>
                </div>
              </div>

              <div class="card-body pb-3">
                <div class="raffle-media-frame mb-3">
                  @if (r.images.length > 0) {
                    <img
                      [src]="currentImage(r).url"
                      [alt]="currentImage(r).altText || r.title"
                      class="raffle-media-frame__image">

                    @if (r.images.length > 1) {
                      <button type="button"
                              class="raffle-media-frame__nav raffle-media-frame__nav--prev"
                              (click)="prevImage($event, r)"
                              aria-label="Imagen anterior">
                        <i class="bi bi-chevron-left"></i>
                      </button>
                      <button type="button"
                              class="raffle-media-frame__nav raffle-media-frame__nav--next"
                              (click)="nextImage($event, r)"
                              aria-label="Imagen siguiente">
                        <i class="bi bi-chevron-right"></i>
                      </button>

                      <div class="raffle-media-frame__dots">
                        @for (img of r.images; track img.url; let i = $index) {
                          <button type="button"
                                  class="raffle-media-frame__dot"
                                  [class.is-active]="currentImageIndex(r.id) === i"
                                  (click)="goToImage($event, r.id, i)"
                                  [attr.aria-label]="'Ir a la imagen ' + (i + 1)"></button>
                        }
                      </div>
                    }
                  } @else {
                    <div class="raffle-media-frame__empty">
                      <i class="bi bi-image"></i>
                      <span>Sin imagenes cargadas</span>
                    </div>
                  }
                </div>

                <div class="raffle-meta-strip">
                  <div class="raffle-meta-strip__item">
                    <span class="raffle-meta-strip__label">Numeros</span>
                    <span class="raffle-meta-strip__value">{{ r.totalNumbers }}</span>
                  </div>
                  <div class="raffle-meta-strip__item">
                    <span class="raffle-meta-strip__label">Participantes</span>
                    <span class="raffle-meta-strip__value">{{ r.participantCount }}</span>
                  </div>
                  <div class="raffle-meta-strip__item raffle-meta-strip__item--date">
                    <span class="raffle-meta-strip__label">Ejecucion</span>
                    <span class="raffle-meta-strip__value">
                      {{ r.drawDateTime ? formatDate(r.drawDateTime) : 'Sin fecha' }}
                    </span>
                  </div>
                  @if (r.winnerName) {
                    <div class="raffle-meta-strip__item raffle-meta-strip__item--date">
                      <span class="raffle-meta-strip__label">Ganador</span>
                      <button type="button" class="raffle-meta-strip__value raffle-meta-strip__value--button"
                              (click)="openWinnerDetails($event, r)">
                        {{ r.winnerName }}@if (r.winnerPhone) { · {{ r.winnerPhone }} }
                      </button>
                    </div>
                  }
                </div>
              </div>

              <div class="card-footer bg-transparent border-top d-flex align-items-center justify-content-between py-2 px-3">
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="badge-pill" [class]="opBadgeCls(r.operationalStatus)">
                    {{ opLabel(r.operationalStatus) }}
                  </span>
                  @if (r.winnerNumber) {
                    <span class="raffle-winner-chip">
                      <button type="button" class="raffle-winner-chip__button" (click)="openWinnerDetails($event, r)">
                        <i class="bi bi-trophy-fill"></i> Ganador: {{ r.winnerNumber }}
                      </button>
                    </span>
                  }
                </div>

                <div class="d-flex align-items-center gap-1">
                  <a [routerLink]="['/rifa', r.slug]" target="_blank"
                     class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
                     title="Ver rifa publica" aria-label="Ver rifa">
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
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class RaffleList implements OnInit, OnDestroy {
  private readonly raffleService = inject(RaffleService);
  private readonly ws = inject(WebSocketService);
  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;
  private drawSubs: Subscription[] = [];
  private activeDrawRaffleId: string | null = null;

  protected readonly loading = signal(true);
  protected readonly raffles = signal<RaffleListItem[]>([]);
  protected readonly showModal = signal(false);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly activeImageIndex = signal<Record<string, number>>({});
  protected readonly liveDrawOpen = signal(false);
  protected readonly liveDrawRaffle = signal<RaffleListItem | null>(null);
  protected readonly liveDrawCountdown = signal<number | null>(null);
  protected readonly liveDrawWinner = signal<number | null>(null);
  protected readonly liveDrawWinnerName = signal('');
  protected readonly winnerModalOpen = signal(false);
  protected readonly winnerModalRaffle = signal<RaffleListItem | null>(null);

  ngOnInit(): void {
    this.load();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }

    this.cleanupDrawSubscriptions();
    this.ws.disconnect();
  }

  protected load(): void {
    this.loading.set(true);
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

  protected closeAllMenus(): void {
    this.openMenuId.set(null);
  }

  protected toggleMenu(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.openMenuId.update(curr => curr === id ? null : id);
  }

  protected currentImage(r: RaffleListItem): RaffleListImage {
    return r.images[this.currentImageIndex(r.id)] ?? r.images[0];
  }

  protected currentImageIndex(id: string): number {
    return this.activeImageIndex()[id] ?? 0;
  }

  protected prevImage(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    const current = this.currentImageIndex(r.id);
    this.setImageIndex(r.id, current === 0 ? r.images.length - 1 : current - 1);
  }

  protected nextImage(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    const current = this.currentImageIndex(r.id);
    this.setImageIndex(r.id, current === r.images.length - 1 ? 0 : current + 1);
  }

  protected goToImage(event: MouseEvent, id: string, index: number): void {
    event.stopPropagation();
    this.setImageIndex(id, index);
  }

  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      const list = this.raffles();
      if (list.length === 0) return;

      const nextState = { ...this.activeImageIndex() };
      for (const raffle of list) {
        if (raffle.images.length > 1) {
          const current = nextState[raffle.id] ?? 0;
          nextState[raffle.id] = current === raffle.images.length - 1 ? 0 : current + 1;
        }
      }

      this.activeImageIndex.set(nextState);
    }, 4500);
  }

  private setImageIndex(id: string, index: number): void {
    this.activeImageIndex.update(state => ({ ...state, [id]: index }));
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

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected cardHeaderGradient(r: RaffleListItem): string {
    const map: Record<string, string> = {
      PUBLISHED: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      DRAFT: 'linear-gradient(135deg, #475569, #64748b)',
      PAUSED: 'linear-gradient(135deg, #d97706, #f59e0b)',
      CLOSED: 'linear-gradient(135deg, #0f172a, #1e293b)',
      FINISHED: 'linear-gradient(135deg, #059669, #10b981)',
    };
    return map[r.publicationStatus] ?? 'linear-gradient(135deg, #475569, #64748b)';
  }

  protected pubBadgeCls(s: string): string {
    return {
      DRAFT: 'badge-pill bg-secondary text-white',
      PUBLISHED: 'badge-pill text-white',
      PAUSED: 'badge-pill bg-warning text-dark',
      CLOSED: 'badge-pill bg-dark text-white',
    }[s] ?? 'badge-pill bg-secondary text-white';
  }

  protected opBadgeCls(s: string): string {
    return {
      ACTIVE: 'badge-pill text-white',
      SOLD_OUT: 'badge-pill bg-warning text-dark',
      FINISHED: 'badge-pill bg-success text-white',
      CANCELLED: 'badge-pill bg-danger text-white',
      EXECUTING: 'badge-pill bg-info text-white',
      PENDING_DRAW: 'badge-pill bg-info text-white',
    }[s] ?? 'badge-pill bg-secondary text-white';
  }

  protected pubLabel(s: string): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada' }[s] ?? s;
  }

  protected opLabel(s: string): string {
    return {
      ACTIVE: 'Activa',
      SOLD_OUT: 'Agotada',
      FINISHED: 'Finalizada',
      CANCELLED: 'Cancelada',
      EXECUTING: 'Sorteando',
      PENDING_DRAW: 'Pronto sorteo'
    }[s] ?? s;
  }
}
