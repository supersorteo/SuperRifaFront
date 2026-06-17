import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { RaffleService } from '../../../core/services/raffle.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListImage, RaffleListItem } from '../../../core/models/raffle.models';
import { RaffleFormModal } from '../raffle-form-modal/raffle-form-modal';
import { RaffleActionsMenu } from '../raffle-actions-menu/raffle-actions-menu';
import { LiveDrawOverlay } from '../../../shared/components/live-draw-overlay/live-draw-overlay';
import { WinnerReservationModal } from '../../../shared/components/winner-reservation-modal/winner-reservation-modal';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialog, ConfirmDialogItem } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../core/services/notification.service';

type DialogType = 'cancel' | 'delete' | 'draw';

@Component({
  selector: 'app-raffle-list',
  imports: [CurrencyArPipe, ConfirmDialog, RaffleFormModal, RaffleActionsMenu, LiveDrawOverlay, WinnerReservationModal, StatusBadge],
  host: { '(document:click)': 'closeAllMenus()' },
  template: `
    <!-- ── Overlays & modals (fuera de cualquier card) ──────────────────── -->
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

    <!-- Confirm dialog al nivel del componente → sin transform ancestor → no parpadea -->
    <app-confirm-dialog
      [open]="pendingDialog() !== null"
      [title]="dlgTitle()"
      [body]="dlgBody()"
      [icon]="dlgIcon()"
      [tone]="dlgTone()"
      [items]="dlgItems()"
      [busy]="dialogBusy()"
      (cancelled)="closePendingDialog()"
      (confirmed)="confirmPendingDialog()" />

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <div class="rl-header">
      <div>
        <h2 class="rl-header__title">Mis Rifas</h2>
        <p class="rl-header__sub">Gestioná todas tus rifas desde aquí</p>
      </div>
      <button class="btn btn-gradient fw-bold px-4 py-2 rounded-3 d-inline-flex align-items-center gap-2"
              (click)="showModal.set(true)"
              aria-label="Crear nueva rifa">
        <i class="bi bi-plus-circle-fill"></i><span>Nueva Rifa</span>
      </button>
    </div>

    <!-- ── Stats strip ───────────────────────────────────────────────────── -->
    @if (!loading() && raffles().length > 0) {
      <div class="rl-stats-bar">
        <div class="rl-stats-bar__item">
          <span class="rl-stats-bar__n">{{ raffles().length }}</span>
          <span class="rl-stats-bar__l">Total</span>
        </div>
        <div class="rl-stats-bar__sep"></div>
        <div class="rl-stats-bar__item">
          <span class="rl-stats-bar__n" style="color:#6366f1">{{ publishedCount() }}</span>
          <span class="rl-stats-bar__l">Publicadas</span>
        </div>
        <div class="rl-stats-bar__sep"></div>
        <div class="rl-stats-bar__item">
          <span class="rl-stats-bar__n" style="color:#f59e0b">{{ draftCount() }}</span>
          <span class="rl-stats-bar__l">Borradores</span>
        </div>
        <div class="rl-stats-bar__sep"></div>
        <div class="rl-stats-bar__item">
          <span class="rl-stats-bar__n" style="color:#10b981">{{ finishedCount() }}</span>
          <span class="rl-stats-bar__l">Finalizadas</span>
        </div>
      </div>
    }

    <!-- ── Loading ───────────────────────────────────────────────────────── -->
    @if (loading()) {
      <div class="rl-state-center" style="min-height:320px">
        <div class="rl-spinner" role="status" aria-label="Cargando"></div>
        <p class="text-muted small mt-3 mb-0">Cargando rifas...</p>
      </div>
    }

    <!-- ── Empty state ───────────────────────────────────────────────────── -->
    @if (!loading() && raffles().length === 0) {
      <div class="rl-empty">
        <div class="rl-empty__icon">
          <i class="bi bi-ticket-perforated-fill"></i>
        </div>
        <div class="rl-empty__title">Todavía no tenés rifas</div>
        <p class="rl-empty__sub">
          Creá tu primera rifa y empezá a vender números hoy mismo.
          Configurá precios, imágenes y fechas en minutos.
        </p>
        <button class="btn btn-gradient fw-bold px-5 py-3 rounded-3 d-inline-flex align-items-center gap-2"
                (click)="showModal.set(true)">
          <i class="bi bi-plus-circle-fill"></i><span>Crear mi primera rifa</span>
        </button>
      </div>
    }

    <!-- ── Grid ──────────────────────────────────────────────────────────── -->
    @if (!loading() && raffles().length > 0) {
      <div class="rl-grid">
        @for (r of raffles(); track r.id) {
          <div class="rl-grid__item">
            <div class="rl-card" [class.rl-card--finished]="r.operationalStatus === 'FINISHED'">
              <!-- Image / placeholder -->
              <div class="rl-card__media">
                @if (r.operationalStatus === 'FINISHED') {
                  <div class="rl-card__finished-ribbon">Terminada</div>
                }
                @if (r.images.length > 0) {
                  <img [src]="currentImage(r).url"
                       [alt]="currentImage(r).altText || r.title"
                       class="rl-card__img">
                  @if (r.images.length > 1) {
                    <button type="button" class="rl-card__nav rl-card__nav--prev"
                            (click)="prevImage($event, r)" aria-label="Imagen anterior">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" class="rl-card__nav rl-card__nav--next"
                            (click)="nextImage($event, r)" aria-label="Imagen siguiente">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                    <div class="rl-card__dots">
                      @for (img of r.images; track img.url; let i = $index) {
                        <button type="button" class="rl-card__dot"
                                [class.is-active]="currentImageIndex(r.id) === i"
                                (click)="goToImage($event, r.id, i)"
                                [attr.aria-label]="'Imagen ' + (i + 1)"></button>
                      }
                    </div>
                  }
                } @else {
                  <div class="rl-card__placeholder" [style.background]="placeholderGradient(r)">
                    <span class="rl-card__initial">{{ r.title.charAt(0).toUpperCase() }}</span>
                  </div>
                }
                <!-- Overlay: pub status + price -->
                <div class="rl-card__overlay">
                  <app-status-badge category="publication" [value]="r.publicationStatus" variant="solid" />
                  <div class="rl-price-chip">{{ r.pricePerNumber | currencyAr }}</div>
                </div>
              </div>

              <!-- Body -->
              <div class="rl-card__body">
                <h5 class="rl-card__title" [title]="r.title">{{ r.title }}</h5>

                <!-- Quick stats -->
                <div class="rl-meta">
                  <div class="rl-meta__item">
                    <i class="bi bi-grid-3x3-gap-fill"></i>
                    <span>{{ r.totalNumbers }}</span>
                  </div>
                  <div class="rl-meta__sep"></div>
                  <div class="rl-meta__item">
                    <i class="bi bi-people-fill"></i>
                    <span>{{ r.participantCount }}</span>
                  </div>
                  @if (r.drawDateTime) {
                    <div class="rl-meta__sep"></div>
                    <div class="rl-meta__item">
                      <i class="bi bi-calendar3"></i>
                      <span>{{ formatDateShort(r.drawDateTime) }}</span>
                    </div>
                  }
                </div>

                <!-- Access code -->
                @if (r.reservationAccessCode && r.publicationStatus !== 'DRAFT') {
                  <div class="rl-code" [class.rl-code--disabled]="r.operationalStatus === 'FINISHED'">
                    <span class="rl-code__label">Código</span>
                    <code class="rl-code__value">{{ r.reservationAccessCode }}</code>
                    <button type="button" class="rl-code__copy"
                            [disabled]="r.operationalStatus === 'FINISHED'"
                            (click)="copyAccessCode($event, r)">
                      <i class="bi" [class]="copiedCode() === r.id ? 'bi-check2-circle' : 'bi-copy'"></i>
                      {{ r.operationalStatus === 'FINISHED' ? 'Inhabilitado' : (copiedCode() === r.id ? 'Copiado' : 'Copiar') }}
                    </button>
                  </div>
                }

                <!-- Winner -->
                @if (r.winnerName) {
                  <button type="button" class="rl-winner-chip"
                          (click)="openWinnerDetails($event, r)">
                    <i class="bi bi-trophy-fill"></i>
                    {{ r.winnerName }}
                    @if (r.winnerPhone) {
                      <span class="rl-winner-chip__phone">· {{ r.winnerPhone }}</span>
                    }
                  </button>
                }
              </div>

              <!-- Footer -->
              <div class="rl-card__footer">
                <div class="d-flex align-items-center gap-2">
                  <app-status-badge category="operational" [value]="r.operationalStatus" variant="solid" />
                  @if (r.winnerNumber) {
                    <span class="rl-winner-num">
                      <i class="bi bi-trophy-fill"></i>{{ r.winnerNumber }}
                    </span>
                  }
                </div>
                <div class="d-flex align-items-center gap-1">
                  <button type="button" class="rl-icon-btn"
                          [title]="copiedLink() === r.id ? 'Enlace copiado' : 'Copiar enlace para participantes'"
                          [attr.aria-label]="copiedLink() === r.id ? 'Enlace copiado' : 'Copiar enlace'"
                          (click)="copyRaffleLink($event, r)">
                    <i class="bi" [class]="copiedLink() === r.id ? 'bi-check2-circle text-success' : 'bi-link-45deg'"></i>
                  </button>
                  <a [href]="'/rifa/' + r.slug" target="_blank" rel="noopener noreferrer"
                     class="rl-icon-btn" title="Ver rifa pública" aria-label="Ver rifa">
                    <i class="bi bi-box-arrow-up-right"></i>
                  </a>
                  <app-raffle-actions-menu
                    [raffle]="r"
                    [isOpen]="openMenuId() === r.id"
                    direction="up"
                    (toggled)="toggleMenu($event, r.id)"
                    (changed)="onRaffleChanged($event)"
                    (cancelRequested)="onCancelRequested(r)"
                    (deleteRequested)="onDeleteRequested(r)"
                    (drawConfirmRequested)="onDrawConfirmRequested(r)" />
                </div>
              </div>

            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    /* ── Header ───────────────────────────────── */
    .rl-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
    }
    .rl-header__title {
      font-size: 1.5rem; font-weight: 900; letter-spacing: -0.035em;
      color: #18181b; margin: 0; line-height: 1.1;
    }
    .rl-header__sub { color: #71717a; font-size: .875rem; margin: .3rem 0 0; }

    /* ── Stats bar ─────────────────────────────── */
    .rl-stats-bar {
      display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
      margin-bottom: 1.5rem;
      padding: .65rem 1.1rem;
      background: #fff;
      border: 1px solid rgba(99,102,241,.1);
      border-radius: .85rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .rl-stats-bar__item { display: flex; align-items: baseline; gap: .35rem; }
    .rl-stats-bar__n { font-size: 1.15rem; font-weight: 900; letter-spacing: -0.03em; color: #18181b; }
    .rl-stats-bar__l { font-size: .75rem; font-weight: 600; color: #a1a1aa; }
    .rl-stats-bar__sep { width: 1px; height: 1.1rem; background: #e4e4e7; }

    /* ── Loading ───────────────────────────────── */
    .rl-state-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .rl-spinner {
      width: 42px; height: 42px; border-radius: 50%;
      border: 3px solid rgba(99,102,241,.15);
      border-top-color: #6366f1;
      animation: spin-slow .8s linear infinite;
    }

    /* ── Empty ─────────────────────────────────── */
    .rl-empty {
      padding: 4rem 1.5rem; text-align: center;
      background: #fff; border-radius: 1.5rem;
      border: 1px dashed rgba(99,102,241,.2);
    }
    .rl-empty__icon {
      width: 88px; height: 88px; border-radius: 1.5rem; margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      border: 1px solid rgba(99,102,241,.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 2.2rem; color: #6366f1;
      animation: float-slow 5s ease-in-out infinite;
    }
    .rl-empty__title {
      font-size: 1.2rem; font-weight: 800; color: #18181b;
      margin-bottom: .5rem; letter-spacing: -0.02em;
    }
    .rl-empty__sub {
      color: #71717a; font-size: .88rem; line-height: 1.65;
      max-width: 400px; margin: 0 auto 2rem;
    }

    /* ── Card ──────────────────────────────────── */
    .rl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(296px, 340px));
      justify-content: center;
      gap: 1.35rem;
    }
    .rl-grid__item {
      width: 100%;
    }

    .rl-card {
      position: relative;
      background: #fff;
      border-radius: 1.25rem;
      border: 1px solid rgba(99,102,241,.08);
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
      display: flex; flex-direction: column;
      height: 100%;
      /* Sin overflow:hidden en el card → el dropdown puede salir del card */
      transition: box-shadow .22s ease, border-color .22s ease;

      &:hover {
        box-shadow: 0 10px 40px rgba(99,102,241,.14), 0 2px 8px rgba(0,0,0,.06);
        border-color: rgba(99,102,241,.18);
        /* SIN transform → no se crea un nuevo stacking context → position:fixed funciona bien */
      }
    }

    .rl-card--finished {
      opacity: .82;
      border-color: rgba(15,23,42,.18);
      box-shadow: 0 10px 28px rgba(15,23,42,.12);
    }
    .rl-card--finished::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 1.25rem;
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(15,23,42,.1));
      pointer-events: none;
      z-index: 1;
    }
    .rl-card__finished-ribbon {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 4;
      width: 280px;
      padding: .52rem 1rem;
      text-align: center;
      background: linear-gradient(135deg, #0f172a, #334155);
      color: #fff;
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
      transform: translate(-50%, -50%) rotate(-33deg);
      box-shadow: 0 10px 24px rgba(15,23,42,.24);
    }

    /* Media section */
    .rl-card__media {
      position: relative;
      height: 228px;
      border-radius: 1.25rem 1.25rem 0 0;
      overflow: hidden; /* solo clipea la imagen, no el dropdown */
      flex-shrink: 0;
      background: linear-gradient(135deg, #eef2ff, #f8fafc);
    }
    .rl-card__media,
    .rl-card__body,
    .rl-card__footer {
      position: relative;
      z-index: 2;
    }
    .rl-card__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      transition: transform .28s ease, filter .28s ease;
    }
    .rl-card:hover .rl-card__img { transform: scale(1.03); filter: saturate(1.04); }
    .rl-card__placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .rl-card__initial {
      font-size: 3.5rem; font-weight: 900; color: rgba(255,255,255,.5);
      user-select: none; letter-spacing: -0.05em;
    }

    /* Nav buttons */
    .rl-card__nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
      color: #fff; border: 1px solid rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; cursor: pointer;
      opacity: 0; transition: opacity .2s;
    }
    .rl-card:hover .rl-card__nav { opacity: 1; }
    .rl-card__nav--prev { left: .5rem; }
    .rl-card__nav--next { right: .5rem; }

    /* Dots */
    .rl-card__dots {
      position: absolute; bottom: .6rem; left: 50%; transform: translateX(-50%);
      display: flex; gap: .3rem;
    }
    .rl-card__dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,.5); border: none; padding: 0; cursor: pointer;
      transition: background .2s, width .2s;
      &.is-active { background: #fff; width: 14px; border-radius: 3px; }
    }

    /* Overlay: pub status + price */
    .rl-card__overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: .6rem .75rem;
      background: linear-gradient(to top, rgba(9,9,11,.75) 0%, transparent 100%);
      display: flex; align-items: flex-end; justify-content: space-between;
    }
    .rl-price-chip {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #78350f; font-size: .75rem; font-weight: 800;
      padding: .2rem .6rem; border-radius: 999px;
      letter-spacing: .01em;
    }

    /* Card body */
    .rl-card__body {
      padding: .85rem .9rem .6rem; flex: 1; display: flex; flex-direction: column; gap: .55rem;
    }
    .rl-card__title {
      font-size: .95rem; font-weight: 800; color: #18181b;
      letter-spacing: -0.02em; line-height: 1.3;
      margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    /* Meta row */
    .rl-meta {
      display: flex; align-items: center; gap: .4rem; flex-wrap: wrap;
    }
    .rl-meta__item {
      display: flex; align-items: center; gap: .25rem;
      font-size: .78rem; color: #71717a; font-weight: 600;
      i { font-size: .72rem; color: #a1a1aa; }
    }
    .rl-meta__sep { width: 3px; height: 3px; border-radius: 50%; background: #d4d4d8; }

    /* Access code */
    .rl-code {
      display: flex; align-items: center; gap: .4rem; flex-wrap: wrap;
      background: #f8f8ff; border: 1px solid rgba(99,102,241,.12);
      border-radius: .6rem; padding: .35rem .6rem;
    }
    .rl-code__label { font-size: .72rem; font-weight: 700; color: #a1a1aa; }
    .rl-code__value { font-size: .78rem; font-weight: 700; color: #4338ca; letter-spacing: .04em; }
    .rl-code__copy {
      margin-left: auto; display: flex; align-items: center; gap: .25rem;
      font-size: .72rem; font-weight: 700; color: #6366f1;
      background: none; border: none; cursor: pointer; padding: 0;
      transition: color .15s;
      &:hover { color: #4338ca; }
    }
    .rl-code--disabled {
      background: #f4f4f5;
      border-color: rgba(161,161,170,.18);
    }
    .rl-code--disabled .rl-code__label,
    .rl-code--disabled .rl-code__value {
      color: #a1a1aa;
    }
    .rl-code__copy:disabled {
      color: #a1a1aa;
      cursor: not-allowed;
      opacity: .85;
    }

    /* Winner chip */
    .rl-winner-chip {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .25rem .65rem; border-radius: 999px;
      background: linear-gradient(135deg, rgba(251,191,36,.12), rgba(239,68,68,.08));
      color: #92400e; font-size: .75rem; font-weight: 700;
      border: 1px solid rgba(251,191,36,.2);
      cursor: pointer; background-color: transparent;
      transition: background .15s;
      &:hover { background: rgba(251,191,36,.2); }
    }
    .rl-winner-chip__phone { opacity: .65; }

    /* Card footer */
    .rl-card__footer {
      padding: .6rem .9rem;
      border-top: 1px solid #f0f0fb;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .rl-winner-num {
      display: inline-flex; align-items: center; gap: .25rem;
      font-size: .72rem; font-weight: 700; color: #92400e;
      i { color: #fbbf24; font-size: .7rem; }
    }
    .rl-icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: .45rem;
      color: #71717a; text-decoration: none;
      background: #f4f4f5; border: 1px solid #e4e4e7;
      font-size: .78rem; transition: all .15s;
      &:hover { background: #eef2ff; color: #6366f1; border-color: #c7d2fe; }
    }

    @media (max-width: 991.98px) {
      .rl-card__media { height: 216px; }
    }

    @media (max-width: 575.98px) {
      .rl-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 1rem;
      }

      .rl-card__media { height: 200px; }
    }
  `]
})
export class RaffleList implements OnInit, OnDestroy {
  private readonly raffleService  = inject(RaffleService);
  private readonly ws             = inject(WebSocketService);
  private readonly notifications  = inject(NotificationService);
  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;
  private realtimeSubs = new Map<string, Subscription[]>();

  protected readonly loading    = signal(true);
  protected readonly raffles    = signal<RaffleListItem[]>([]);
  protected readonly showModal  = signal(false);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly activeImageIndex = signal<Record<string, number>>({});
  protected readonly copiedCode         = signal<string | null>(null);
  protected readonly copiedLink         = signal<string | null>(null);
  protected readonly liveDrawOpen       = signal(false);
  protected readonly liveDrawRaffle     = signal<RaffleListItem | null>(null);
  protected readonly liveDrawCountdown  = signal<number | null>(null);
  protected readonly liveDrawWinner     = signal<number | null>(null);
  protected readonly liveDrawWinnerName = signal('');
  protected readonly winnerModalOpen    = signal(false);
  protected readonly winnerModalRaffle  = signal<RaffleListItem | null>(null);

  /* ── Dialog state (a nivel componente, fuera de cualquier card) ─────── */
  protected readonly pendingDialog = signal<{ type: DialogType; raffle: RaffleListItem } | null>(null);
  protected readonly dialogBusy   = signal(false);

  protected readonly publishedCount = computed(() => this.raffles().filter(r => r.publicationStatus === 'PUBLISHED').length);
  protected readonly draftCount     = computed(() => this.raffles().filter(r => r.publicationStatus === 'DRAFT').length);
  protected readonly finishedCount  = computed(() => this.raffles().filter(r => r.operationalStatus === 'FINISHED').length);

  /* ── Dialog computed config ─────────────────────────────────────────── */
  protected readonly dlgTitle = computed(() => {
    const t = this.pendingDialog()?.type;
    return t === 'cancel' ? 'Cancelar rifa' : t === 'delete' ? 'Eliminar rifa' : 'Ejecutar sorteo';
  });
  protected readonly dlgBody = computed(() => {
    const p = this.pendingDialog();
    if (!p) return '';
    const name = p.raffle.title;
    if (p.type === 'cancel') return `La rifa "${name}" se cerrara definitivamente, se conservara el historial y las reservas activas quedaran canceladas.`;
    if (p.type === 'delete') return `Se eliminara por completo la rifa "${name}" junto con su pagina publica y sus reservas. Esta accion no se puede deshacer.`;
    return `Se ejecutara el sorteo de "${name}" en tiempo real y esta accion no se puede deshacer.`;
  });
  protected readonly dlgIcon = computed(() => {
    const t = this.pendingDialog()?.type;
    return t === 'cancel' ? 'bi bi-slash-circle-fill' : t === 'delete' ? 'bi bi-trash3-fill' : 'bi bi-stars';
  });
  protected readonly dlgTone = computed((): 'warning' | 'danger' | 'info' => {
    const t = this.pendingDialog()?.type;
    return t === 'draw' ? 'info' : t === 'delete' ? 'warning' : 'danger';
  });
  protected readonly dlgItems = computed((): ConfirmDialogItem[] => {
    const t = this.pendingDialog()?.type;
    if (t === 'cancel') return [
      { icon: 'bi bi-archive-fill',   color: '#94a3b8', text: 'La rifa quedara cerrada definitivamente' },
      { icon: 'bi bi-clock-history',  color: '#818cf8', text: 'Se conservara el historial interno' },
      { icon: 'bi bi-x-circle-fill',  color: '#f87171', text: 'Las reservas activas se cancelaran' },
    ];
    if (t === 'delete') return [
      { icon: 'bi bi-globe2',         color: '#818cf8', text: 'Se eliminara la pagina publica' },
      { icon: 'bi bi-hash',           color: '#f59e0b', text: 'Se eliminaran todos los numeros de la rifa' },
      { icon: 'bi bi-people-fill',    color: '#f87171', text: 'Se eliminaran reservas y datos asociados' },
    ];
    return [
      { icon: 'bi bi-broadcast',      color: '#06b6d4', text: 'El conteo se vera en tiempo real' },
      { icon: 'bi bi-shuffle',        color: '#818cf8', text: 'El numero ganador saldra del rango valido de la rifa' },
      { icon: 'bi bi-lock-fill',      color: '#f59e0b', text: 'La ejecucion no se puede deshacer' },
    ];
  });

  ngOnInit(): void { this.load(); this.startAutoSlide(); }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) { clearInterval(this.autoSlideTimer); this.autoSlideTimer = null; }
    this.cleanupRealtimeSubscriptions();
    this.ws.disconnect();
  }

  protected load(): void {
    this.loading.set(true);
    this.raffleService.getMyRaffles().subscribe({
      next: raffles => { this.raffles.set(raffles); this.loading.set(false); this.syncRealtimeSubscriptions(raffles); },
      error: () => this.loading.set(false),
    });
  }

  protected onRaffleCreated(): void { this.load(); }

  protected onRaffleChanged(updated: RaffleListItem): void {
    this.openMenuId.set(null);
    this.raffles.update(list => list.map(x => x.id === updated.id ? updated : x));
  }

  protected onRaffleDeleted(id: string): void {
    this.openMenuId.set(null);
    this.raffles.update(list => list.filter(x => x.id !== id));
  }

  protected closeAllMenus(): void { this.openMenuId.set(null); }

  protected toggleMenu(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.openMenuId.update(curr => curr === id ? null : id);
  }

  /* ── Dialog handlers ─────────────────────────────────────────────────── */
  protected onCancelRequested(raffle: RaffleListItem): void {
    this.openMenuId.set(null);
    this.pendingDialog.set({ type: 'cancel', raffle });
  }
  protected onDeleteRequested(raffle: RaffleListItem): void {
    this.openMenuId.set(null);
    this.pendingDialog.set({ type: 'delete', raffle });
  }
  protected onDrawConfirmRequested(raffle: RaffleListItem): void {
    this.openMenuId.set(null);
    this.pendingDialog.set({ type: 'draw', raffle });
  }
  protected closePendingDialog(): void {
    this.pendingDialog.set(null);
    this.dialogBusy.set(false);
  }
  protected confirmPendingDialog(): void {
    const p = this.pendingDialog();
    if (!p) return;
    this.dialogBusy.set(true);

    if (p.type === 'cancel') {
      this.raffleService.cancel(p.raffle.id).subscribe({
        next: updated => { this.onRaffleChanged(updated); this.closePendingDialog(); },
        error: () => this.closePendingDialog(),
      });
    } else if (p.type === 'delete') {
      this.raffleService.delete(p.raffle.id).subscribe({
        next: () => { this.onRaffleDeleted(p.raffle.id); this.closePendingDialog(); },
        error: () => this.closePendingDialog(),
      });
    } else {
      this.closePendingDialog();
      this.liveDrawOpen.set(true);
      this.liveDrawRaffle.set(p.raffle);
      this.liveDrawCountdown.set(5);
      this.liveDrawWinner.set(null);
      this.liveDrawWinnerName.set('');
      this.raffleService.executeDraw(p.raffle.id).subscribe({
        next: () => this.load(),
        error: (e: Error) => {
          this.liveDrawOpen.set(false);
          this.liveDrawRaffle.set(null);
          this.liveDrawCountdown.set(null);
          this.liveDrawWinner.set(null);
          this.liveDrawWinnerName.set('');
          this.notifications.error('No se pudo ejecutar el sorteo', e.message);
        },
      });
    }
  }

  /* ── Image carousel ─────────────────────────────────────────────────── */
  protected currentImage(r: RaffleListItem): RaffleListImage {
    return r.images[this.currentImageIndex(r.id)] ?? r.images[0];
  }
  protected currentImageIndex(id: string): number { return this.activeImageIndex()[id] ?? 0; }
  protected prevImage(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    const i = this.currentImageIndex(r.id);
    this.setImageIndex(r.id, i === 0 ? r.images.length - 1 : i - 1);
  }
  protected nextImage(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    const i = this.currentImageIndex(r.id);
    this.setImageIndex(r.id, i === r.images.length - 1 ? 0 : i + 1);
  }
  protected goToImage(event: MouseEvent, id: string, index: number): void {
    event.stopPropagation();
    this.setImageIndex(id, index);
  }
  private setImageIndex(id: string, index: number): void {
    this.activeImageIndex.update(s => ({ ...s, [id]: index }));
  }
  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      const list = this.raffles();
      if (!list.length) return;
      const next = { ...this.activeImageIndex() };
      for (const r of list) {
        if (r.images.length > 1) {
          const i = next[r.id] ?? 0;
          next[r.id] = i === r.images.length - 1 ? 0 : i + 1;
        }
      }
      this.activeImageIndex.set(next);
    }, 4500);
  }

  /* ── Misc ────────────────────────────────────────────────────────────── */
  protected openWinnerDetails(event: MouseEvent, raffle: RaffleListItem): void {
    event.stopPropagation();
    if (!raffle.winnerPhone) return;
    this.winnerModalRaffle.set(raffle);
    this.winnerModalOpen.set(true);
  }

  protected copyRaffleLink(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    const url = `${window.location.origin}/rifa/${r.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedLink.set(r.id);
      setTimeout(() => this.copiedLink.set(null), 1800);
    }).catch(() => {});
  }

  protected copyAccessCode(event: MouseEvent, r: RaffleListItem): void {
    event.stopPropagation();
    if (r.operationalStatus === 'FINISHED') return;
    const code = r.reservationAccessCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(r.id);
      setTimeout(() => this.copiedCode.set(null), 1800);
    }).catch(() => this.copiedCode.set(null));
  }

  protected formatDateShort(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  protected placeholderGradient(r: RaffleListItem): string {
    const map: Record<string, string> = {
      PUBLISHED: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      DRAFT:     'linear-gradient(135deg,#475569,#64748b)',
      PAUSED:    'linear-gradient(135deg,#d97706,#f59e0b)',
      CLOSED:    'linear-gradient(135deg,#0f172a,#1e293b)',
      FINISHED:  'linear-gradient(135deg,#059669,#10b981)',
    };
    return map[r.publicationStatus] ?? 'linear-gradient(135deg,#475569,#64748b)';
  }

  private syncRealtimeSubscriptions(raffles: RaffleListItem[]): void {
    const activeIds = new Set(raffles.map(r => r.id));
    for (const [raffleId, subs] of this.realtimeSubs.entries()) {
      if (activeIds.has(raffleId)) continue;
      subs.forEach(s => s.unsubscribe());
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/progress`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/status`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/countdown`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/result`);
      this.realtimeSubs.delete(raffleId);
    }
    this.ws.connect().then(() => {
      for (const raffle of raffles) {
        if (this.realtimeSubs.has(raffle.id)) continue;
        const subs = [
          this.ws.subscribe<{ available: number; reserved: number; paid: number }>(`/topic/raffle/${raffle.id}/progress`).subscribe(evt => {
            this.raffles.update(list => list.map(item =>
              item.id === raffle.id ? {
                ...item, reservedCount: evt.reserved,
                operationalStatus: item.operationalStatus === 'FINISHED' ? item.operationalStatus
                  : (evt.available === 0 ? 'SOLD_OUT' : 'ACTIVE')
              } : item
            ));
          }),
          this.ws.subscribe<{ status: string }>(`/topic/raffle/${raffle.id}/status`).subscribe(evt => {
            if (evt.status === 'EXECUTING') {
              const current = this.raffles().find(item => item.id === raffle.id) ?? raffle;
              this.liveDrawOpen.set(true); this.liveDrawRaffle.set(current);
              this.liveDrawCountdown.set(5); this.liveDrawWinner.set(null); this.liveDrawWinnerName.set('');
              this.raffles.update(list => list.map(item =>
                item.id === raffle.id ? { ...item, operationalStatus: 'EXECUTING' } : item
              ));
            }
            if (evt.status === 'FAILED') {
              this.liveDrawOpen.set(false); this.liveDrawRaffle.set(null);
              this.liveDrawCountdown.set(null); this.liveDrawWinner.set(null); this.liveDrawWinnerName.set('');
              this.raffles.update(list => list.map(item =>
                item.id === raffle.id ? { ...item, operationalStatus: item.reservedCount > 0 ? 'ACTIVE' : item.operationalStatus } : item
              ));
            }
          }),
          this.ws.subscribe<{ secondsRemaining: number }>(`/topic/raffle/${raffle.id}/countdown`).subscribe(evt => {
            this.liveDrawOpen.set(true); this.liveDrawCountdown.set(evt.secondsRemaining);
          }),
          this.ws.subscribe<{ winnerNumber: number; winnerName?: string; winnerPhone?: string }>(`/topic/raffle/${raffle.id}/result`).subscribe(evt => {
            this.liveDrawCountdown.set(null); this.liveDrawWinner.set(evt.winnerNumber); this.liveDrawWinnerName.set(evt.winnerName || '');
            this.raffles.update(list => list.map(item =>
              item.id === raffle.id ? {
                ...item, operationalStatus: 'FINISHED', winnerNumber: evt.winnerNumber,
                winnerName: evt.winnerName || item.winnerName, winnerPhone: evt.winnerPhone || item.winnerPhone,
              } : item
            ));
            setTimeout(() => {
              this.liveDrawOpen.set(false); this.liveDrawRaffle.set(null);
              this.liveDrawWinner.set(null); this.liveDrawWinnerName.set('');
              this.load();
            }, 3200);
          }),
        ];
        this.realtimeSubs.set(raffle.id, subs);
      }
    }).catch(() => {
      this.liveDrawOpen.set(false); this.liveDrawRaffle.set(null);
      this.liveDrawCountdown.set(null); this.liveDrawWinner.set(null); this.liveDrawWinnerName.set('');
    });
  }

  private cleanupRealtimeSubscriptions(): void {
    for (const [raffleId, subs] of this.realtimeSubs.entries()) {
      subs.forEach(s => s.unsubscribe());
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/progress`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/status`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/countdown`);
      this.ws.unsubscribe(`/topic/raffle/${raffleId}/result`);
    }
    this.realtimeSubs.clear();
  }
}
