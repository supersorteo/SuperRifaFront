import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialog, ConfirmDialogItem } from '../../../shared/components/confirm-dialog/confirm-dialog';

type DialogType = 'cancel' | 'delete' | 'draw';

@Component({
  selector: 'app-dashboard-home',
  imports: [DecimalPipe, RouterLink, CurrencyArPipe, ConfirmDialog, RaffleFormModal, RaffleActionsMenu, LiveDrawOverlay, WinnerReservationModal, StatusBadge],
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

    <!-- ── Page header ─────────────────────────────────────────────────── -->
    <div class="dh-header">
      <div class="dh-header__text">
        <div class="dh-greeting">{{ greeting() }}, <span class="dh-greeting__name">{{ firstName() }}</span> 👋</div>
        <p class="dh-header__sub">Aquí está el resumen de tu actividad</p>
      </div>
      <button class="btn btn-gradient fw-bold px-4 py-2 rounded-3 d-inline-flex align-items-center gap-2"
              (click)="showModal.set(true)"
              aria-label="Crear nueva rifa">
        <i class="bi bi-plus-circle-fill"></i><span>Nueva Rifa</span>
      </button>
    </div>

    <!-- ── Stat cards ──────────────────────────────────────────────────── -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-xl-3">
        <div class="stat-card stat-card--indigo d-flex justify-content-between align-items-start">
          <div>
            <div class="stat-card__value">{{ raffles().length }}</div>
            <div class="stat-card__label">Total rifas</div>
          </div>
          <i class="bi bi-ticket-perforated stat-card__icon"></i>
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

    <!-- ── Recent raffles ──────────────────────────────────────────────── -->
    <div class="dh-card">
      <div class="dh-card__header">
        <div class="d-flex align-items-center gap-2">
          <div class="dh-card__icon">
            <i class="bi bi-list-ul"></i>
          </div>
          <div>
            <div class="dh-card__title">Rifas recientes</div>
            <div class="dh-card__sub">
              Últimas {{ recentRaffles().length }} de {{ raffles().length }} rifas
            </div>
          </div>
        </div>
        @if (raffles().length > 0) {
          <a routerLink="/dashboard/rifas"
             class="btn btn-sm fw-semibold rounded-3 px-3 d-inline-flex align-items-center gap-1"
             style="background:#f3f4ff;color:#6366f1;border:1px solid rgba(99,102,241,.18)">
            Ver todas <i class="bi bi-arrow-right"></i>
          </a>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="dh-state-center py-5">
          <div class="dh-spinner" role="status" aria-label="Cargando"></div>
          <p class="text-muted small mt-3 mb-0">Cargando rifas...</p>
        </div>
      }

      <!-- Empty state: UN SOLO botón (el del header es el primario, aquí solo guía al usuario) -->
      @else if (recentRaffles().length === 0) {
        <div class="dh-empty">
          <div class="dh-empty__icon">
            <i class="bi bi-ticket-perforated-fill"></i>
          </div>
          <div class="dh-empty__title">Todavía no tenés rifas</div>
          <p class="dh-empty__sub">
            Usá el botón <strong>"Nueva Rifa"</strong> de arriba para crear tu primera rifa y empezar a vender números.
          </p>
          <!-- Flecha visual apuntando hacia arriba (no botón duplicado) -->
          <div class="dh-empty__hint" aria-hidden="true">
            <i class="bi bi-arrow-up-circle-fill"></i>
            <span>Botón "Nueva Rifa" arriba a la derecha</span>
          </div>
        </div>
      }

      <!-- Table -->
      @else {
        <div class="table-responsive dh-table-wrap">
          <table class="table table-hover align-middle mb-0 dh-table">
            <thead>
              <tr>
                <th class="ps-4">Rifa</th>
                <th>Estado</th>
                <th class="d-none d-md-table-cell">Números</th>
                <th class="d-none d-lg-table-cell">Precio</th>
                <th class="d-none d-lg-table-cell">Vendido</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              @for (r of recentRaffles(); track r.id) {
                <tr class="dh-table-row">
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-3">
                      <!-- Color avatar based on first letter -->
                      <div class="dh-raffle-avatar" [style]="avatarStyle(r)">
                        {{ r.title.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="fw-bold" style="font-size:.9rem;letter-spacing:-0.01em">{{ r.title }}</div>
                        @if (r.drawDateTime) {
                          <div class="small text-muted d-flex align-items-center gap-1 mt-1">
                            <i class="bi bi-calendar3" style="font-size:.7rem"></i>
                            {{ formatDate(r.drawDateTime) }}
                          </div>
                        }
                        @if (r.winnerName) {
                          <button type="button"
                                  class="dh-winner-chip mt-1"
                                  (click)="openWinnerDetails($event, r)">
                            <i class="bi bi-trophy-fill"></i>
                            {{ r.winnerName }}
                            @if (r.winnerPhone) { <span class="opacity-75">· {{ r.winnerPhone }}</span> }
                          </button>
                        }
                        @if (r.reservationAccessCode && r.publicationStatus !== 'DRAFT') {
                          <button type="button"
                                  class="dh-code-chip mt-1"
                                  [class.dh-code-chip--disabled]="r.operationalStatus === 'FINISHED'"
                                  [disabled]="r.operationalStatus === 'FINISHED'"
                                  (click)="copyAccessCode($event, r)">
                            <i class="bi"
                               [class]="r.operationalStatus === 'FINISHED'
                                 ? 'bi-lock-fill'
                                 : copiedCode() === r.id ? 'bi-check2-circle text-success' : 'bi-copy'"></i>
                            <code>{{ r.reservationAccessCode }}</code>
                            @if (r.operationalStatus === 'FINISHED') {
                              <span>Inhabilitado</span>
                            } @else if (copiedCode() === r.id) {
                              <span class="text-success">¡Copiado!</span>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  </td>

                  <td>
                    <app-status-badge
                      [category]="r.operationalStatus === 'FINISHED' ? 'operational' : 'publication'"
                      [value]="r.operationalStatus === 'FINISHED' ? r.operationalStatus : r.publicationStatus"
                      variant="solid" />
                  </td>

                  <td class="d-none d-md-table-cell">
                    <span class="dh-cell-value">{{ r.totalNumbers }}</span>
                  </td>

                  <td class="d-none d-lg-table-cell">
                    <span class="dh-cell-value">{{ r.pricePerNumber | currencyAr }}</span>
                  </td>

                  <!-- Sold progress mini -->
                  <td class="d-none d-lg-table-cell">
                    @if (r.totalNumbers > 0) {
                      <div class="dh-mini-progress">
                        <div class="dh-mini-progress__bar"
                             [style.width.%]="soldPct(r)"
                             [style.background]="soldPct(r) >= 80 ? 'linear-gradient(90deg,#10b981,#059669)' : soldPct(r) >= 40 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)'">
                        </div>
                      </div>
                      <div class="dh-mini-progress__label">{{ soldPct(r) | number:'1.0-0' }}%</div>
                    }
                  </td>

                  <td class="pe-3">
                    <div class="d-flex align-items-center justify-content-end gap-1">
                      <a [routerLink]="['/rifa', r.slug]" target="_blank"
                         class="dh-icon-btn"
                         aria-label="Ver rifa pública"
                         title="Ver página pública">
                        <i class="bi bi-box-arrow-up-right"></i>
                      </a>
                      <app-raffle-actions-menu
                        [raffle]="r"
                        [isOpen]="openMenuId() === r.id"
                        [direction]="menuDirection($index, recentRaffles().length)"
                        [fixedMenu]="true"
                        (toggled)="toggleMenu($event, r.id)"
                        (changed)="onRaffleChanged($event)"
                        (cancelRequested)="onCancelRequested(r)"
                        (deleteRequested)="onDeleteRequested(r)"
                        (drawConfirmRequested)="onDrawConfirmRequested(r)" />
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (raffles().length > 5) {
          <div class="dh-card__footer">
            <a routerLink="/dashboard/rifas"
               class="dh-see-all">
              Ver todas las rifas ({{ raffles().length }})
              <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    /* ── Page header ──────────────────────────────── */
    .dh-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem;
    }
    .dh-greeting {
      font-size: 1.5rem; font-weight: 900; letter-spacing: -0.035em;
      color: #18181b; line-height: 1.1;
    }
    .dh-greeting__name {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .dh-header__sub { color: #71717a; font-size: .875rem; margin: .3rem 0 0; }

    /* ── Raffle card ──────────────────────────────── */
    .dh-card {
      background: #fff; border-radius: 1.5rem;
      box-shadow: 0 4px 24px rgba(99,102,241,.08), 0 1px 4px rgba(0,0,0,.05);
      border: 1px solid rgba(99,102,241,.07);
    }
    .dh-card .table-responsive.dh-table-wrap {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(99,102,241,.35) transparent;
    }
    .dh-card .table-responsive.dh-table-wrap::-webkit-scrollbar {
      height: 10px;
    }
    .dh-card .table-responsive.dh-table-wrap::-webkit-scrollbar-thumb {
      background: rgba(99,102,241,.28);
      border-radius: 999px;
    }
    .dh-card .table-responsive.dh-table-wrap::-webkit-scrollbar-track {
      background: transparent;
    }
    .dh-table {
      min-width: 720px;
    }
    .dh-card__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.25rem; border-bottom: 1px solid #f0f0fb;
      flex-wrap: wrap; gap: .75rem;
    }
    .dh-card__icon {
      width: 36px; height: 36px; border-radius: .65rem; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .95rem;
      box-shadow: 0 4px 10px rgba(99,102,241,.35);
    }
    .dh-card__title { font-weight: 800; font-size: .9rem; color: #18181b; letter-spacing: -0.015em; }
    .dh-card__sub   { font-size: .75rem; color: #a1a1aa; margin-top: 1px; }
    .dh-card__footer {
      padding: .9rem 1.25rem; border-top: 1px solid #f0f0fb; background: #fafaff;
    }
    .dh-see-all {
      display: inline-flex; align-items: center; gap: .4rem;
      color: #6366f1; font-size: .85rem; font-weight: 700; text-decoration: none;
      &:hover { color: #4338ca; }
    }

    /* ── Loading spinner ──────────────────────────── */
    .dh-state-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .dh-spinner {
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid rgba(99,102,241,.15);
      border-top-color: #6366f1;
      animation: spin-slow .8s linear infinite;
    }

    /* ── Empty state (sin botón duplicado) ────────── */
    .dh-empty {
      padding: 3.5rem 2rem; text-align: center;
    }
    .dh-empty__icon {
      width: 80px; height: 80px; border-radius: 1.5rem; margin: 0 auto 1.25rem;
      background: linear-gradient(135deg, #eef2ff, #e0e3ff);
      border: 1px solid rgba(99,102,241,.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: #6366f1;
      animation: float-slow 5s ease-in-out infinite;
    }
    .dh-empty__title {
      font-size: 1.15rem; font-weight: 800; color: #18181b;
      margin-bottom: .5rem; letter-spacing: -0.02em;
    }
    .dh-empty__sub {
      color: #71717a; font-size: .88rem; line-height: 1.65;
      max-width: 380px; margin: 0 auto 1.5rem;
    }
    .dh-empty__hint {
      display: inline-flex; align-items: center; gap: .5rem;
      color: #6366f1; font-size: .8rem; font-weight: 600;
      background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.15);
      border-radius: 999px; padding: .4rem .9rem;
      i { animation: float-slow 2s ease-in-out infinite; }
    }

    /* ── Table ────────────────────────────────────── */
    .dh-table-row {
      transition: background .12s;
      &:hover { background: #fafaff !important; }
    }
    .dh-table th,
    .dh-table td {
      white-space: nowrap;
      vertical-align: middle;
    }

    /* Raffle color avatar */
    .dh-raffle-avatar {
      width: 40px; height: 40px; border-radius: .75rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: .95rem; color: #fff;
    }

    /* Winner chip */
    .dh-winner-chip {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .2rem .6rem; border-radius: 999px;
      background: linear-gradient(135deg, rgba(251,191,36,.14), rgba(239,68,68,.1));
      color: #92400e; font-size: .72rem; font-weight: 700;
      border: 1px solid rgba(251,191,36,.25);
      cursor: pointer; text-decoration: none;
      transition: background .15s;
      background-color: transparent; /* reset button */
      &:hover { background: rgba(251,191,36,.2); }
    }

    /* Access code chip */
    .dh-code-chip {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .2rem .6rem; border-radius: .4rem;
      background: rgba(99,102,241,.07); color: #4338ca;
      font-size: .72rem; font-weight: 600;
      border: 1px solid rgba(99,102,241,.12);
      cursor: pointer; background-color: transparent; /* reset button */
      transition: background .15s;
      code { font-size: .72rem; color: inherit; }
      &:hover { background: rgba(99,102,241,.12); }
    }
    .dh-code-chip--disabled {
      cursor: not-allowed;
      background: rgba(148,163,184,.12);
      color: #64748b;
      border-color: rgba(148,163,184,.2);
      opacity: .85;
      &:hover { background: rgba(148,163,184,.12); }
    }

    /* Table cells */
    .dh-cell-value {
      font-size: .85rem; font-weight: 600; color: #3f3f46;
    }

    /* Mini sold progress */
    .dh-mini-progress {
      height: 6px; border-radius: 999px; overflow: hidden;
      background: #e4e4e7; width: 80px; margin-bottom: 3px;
    }
    .dh-mini-progress__bar {
      height: 100%; border-radius: 999px;
      transition: width .5s ease;
    }
    .dh-mini-progress__label {
      font-size: .7rem; font-weight: 700; color: #71717a;
    }

    /* Icon button (external link) */
    .dh-icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: .5rem;
      color: #71717a; text-decoration: none;
      background: #f4f4f5; border: 1px solid #e4e4e7;
      font-size: .82rem; transition: all .15s;
      &:hover { background: #eef2ff; color: #6366f1; border-color: #c7d2fe; }
    }
    @media (max-width: 767.98px) {
      .dh-card__header {
        padding-bottom: .85rem;
      }
      .dh-table {
        min-width: 680px;
      }
    }
  `]
})
export class DashboardHome implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly raffleService = inject(RaffleService);
  private readonly ws = inject(WebSocketService);
  private readonly notifications = inject(NotificationService);
  private realtimeSubs = new Map<string, Subscription[]>();

  protected readonly loading    = signal(true);
  protected readonly raffles    = signal<RaffleListItem[]>([]);
  protected readonly showModal  = signal(false);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly liveDrawOpen       = signal(false);
  protected readonly liveDrawRaffle     = signal<RaffleListItem | null>(null);
  protected readonly liveDrawCountdown  = signal<number | null>(null);
  protected readonly liveDrawWinner     = signal<number | null>(null);
  protected readonly liveDrawWinnerName = signal('');
  protected readonly winnerModalOpen    = signal(false);
  protected readonly winnerModalRaffle  = signal<RaffleListItem | null>(null);
  protected readonly copiedCode         = signal<string | null>(null);
  protected readonly pendingDialog      = signal<{ type: DialogType; raffle: RaffleListItem } | null>(null);
  protected readonly dialogBusy         = signal(false);

  protected readonly firstName = computed(() => {
    const parts = this.auth.orgUser()?.fullName?.split(' ') ?? [];
    return parts.length > 0 ? parts[0] : 'organizador';
  });
  protected readonly activeCount   = computed(() => this.raffles().filter(r => r.publicationStatus === 'PUBLISHED').length);
  protected readonly draftCount    = computed(() => this.raffles().filter(r => r.publicationStatus === 'DRAFT').length);
  protected readonly finishedCount = computed(() => this.raffles().filter(r => r.operationalStatus === 'FINISHED').length);
  protected readonly recentRaffles = computed(() => this.raffles().slice(0, 5));

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
      { icon: 'bi bi-archive-fill',  color: '#94a3b8', text: 'La rifa quedara cerrada definitivamente' },
      { icon: 'bi bi-clock-history', color: '#818cf8', text: 'Se conservara el historial interno' },
      { icon: 'bi bi-x-circle-fill', color: '#f87171', text: 'Las reservas activas se cancelaran' },
    ];
    if (t === 'delete') return [
      { icon: 'bi bi-globe2',        color: '#818cf8', text: 'Se eliminara la pagina publica' },
      { icon: 'bi bi-hash',          color: '#f59e0b', text: 'Se eliminaran todos los numeros de la rifa' },
      { icon: 'bi bi-people-fill',   color: '#f87171', text: 'Se eliminaran reservas y datos asociados' },
    ];
    return [
      { icon: 'bi bi-broadcast',     color: '#06b6d4', text: 'El conteo se vera en tiempo real' },
      { icon: 'bi bi-shuffle',       color: '#818cf8', text: 'El numero ganador saldra del rango valido de la rifa' },
      { icon: 'bi bi-lock-fill',     color: '#f59e0b', text: 'La ejecucion no se puede deshacer' },
    ];
  });

  protected greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  protected soldPct(r: RaffleListItem): number {
    if (!r.totalNumbers) return 0;
    return Math.round(((r.reservedCount ?? 0) / r.totalNumbers) * 100);
  }

  protected menuDirection(index: number, total: number): 'up' | 'down' {
    return index < Math.min(2, total - 1) ? 'down' : 'up';
  }

  protected avatarStyle(r: RaffleListItem): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#ec4899,#f43f5e)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#fbbf24,#f59e0b)',
      'linear-gradient(135deg,#22d3ee,#0891b2)',
      'linear-gradient(135deg,#8b5cf6,#6366f1)',
    ];
    const idx = r.title.charCodeAt(0) % colors.length;
    return `background:${colors[idx]}`;
  }

  ngOnInit(): void { this.load(); }

  ngOnDestroy(): void {
    this.cleanupRealtimeSubscriptions();
    this.ws.disconnect();
  }

  protected load(): void {
    this.raffleService.getMyRaffles().subscribe({
      next: raffles => {
        this.raffles.set(raffles);
        this.loading.set(false);
        this.syncRealtimeSubscriptions(raffles);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onRaffleCreated(): void { this.load(); }

  protected closeAllMenus(): void { this.openMenuId.set(null); }

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

  protected openWinnerDetails(event: MouseEvent, raffle: RaffleListItem): void {
    event.stopPropagation();
    if (!raffle.winnerPhone) return;
    this.winnerModalRaffle.set(raffle);
    this.winnerModalOpen.set(true);
  }

  protected copyAccessCode(event: MouseEvent, raffle: RaffleListItem): void {
    event.stopPropagation();
    if (raffle.operationalStatus === 'FINISHED') return;
    const code = raffle.reservationAccessCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(raffle.id);
      setTimeout(() => this.copiedCode.set(null), 1800);
    }).catch(() => this.copiedCode.set(null));
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
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
                ...item,
                reservedCount: evt.reserved,
                operationalStatus: item.operationalStatus === 'FINISHED'
                  ? item.operationalStatus
                  : (evt.available === 0 ? 'SOLD_OUT' : 'ACTIVE')
              } : item
            ));
          }),
          this.ws.subscribe<{ status: string }>(`/topic/raffle/${raffle.id}/status`).subscribe(evt => {
            if (evt.status === 'EXECUTING') {
              const current = this.raffles().find(item => item.id === raffle.id) ?? raffle;
              this.liveDrawOpen.set(true);
              this.liveDrawRaffle.set(current);
              this.liveDrawCountdown.set(5);
              this.liveDrawWinner.set(null);
              this.liveDrawWinnerName.set('');
              this.raffles.update(list => list.map(item =>
                item.id === raffle.id ? { ...item, operationalStatus: 'EXECUTING' } : item
              ));
            }
            if (evt.status === 'FAILED') {
              this.liveDrawOpen.set(false);
              this.liveDrawRaffle.set(null);
              this.liveDrawCountdown.set(null);
              this.liveDrawWinner.set(null);
              this.liveDrawWinnerName.set('');
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
              this.load();
            }, 3200);
          }),
        ];
        this.realtimeSubs.set(raffle.id, subs);
      }
    }).catch(() => {
      this.liveDrawOpen.set(false);
      this.liveDrawRaffle.set(null);
      this.liveDrawCountdown.set(null);
      this.liveDrawWinner.set(null);
      this.liveDrawWinnerName.set('');
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
