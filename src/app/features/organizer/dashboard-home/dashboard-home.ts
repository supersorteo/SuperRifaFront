import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListItem } from '../../../core/models/raffle.models';
import { RaffleFormModal } from '../raffle-form-modal/raffle-form-modal';
import { RaffleActionsMenu } from '../raffle-actions-menu/raffle-actions-menu';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, CurrencyArPipe, RaffleFormModal, RaffleActionsMenu],
  host: { '(document:click)': 'closeAllMenus()' },
  template: `
    <!-- Modal nueva rifa -->
    <app-raffle-form-modal
      [open]="showModal()"
      (closed)="showModal.set(false)"
      (created)="onRaffleCreated()" />

    <!-- Welcome header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-1">
          Hola, {{ firstName() }} <span style="font-style:normal">👋</span>
        </h2>
        <p class="text-muted mb-0">Aquí está el resumen de tu actividad</p>
      </div>
      <button class="btn btn-gradient fw-semibold px-4 rounded-3" (click)="showModal.set(true)">
        <i class="bi bi-plus-circle-fill me-2"></i>Nueva Rifa
      </button>
    </div>

    <!-- Stat cards -->
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

    <!-- Recent raffles table -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <div>
          <h6 class="fw-bold mb-0">Rifas recientes</h6>
          <p class="text-muted small mb-0">Últimas {{ recentRaffles().length }} rifas</p>
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
            <p class="text-muted mt-3 mb-3">Todavía no tenés rifas</p>
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
                  <th class="d-none d-md-table-cell">Números</th>
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
                           aria-label="Ver rifa pública">
                          <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                        <app-raffle-actions-menu
                          [raffle]="r"
                          [isOpen]="openMenuId() === r.id"
                          (toggled)="toggleMenu($event, r.id)"
                          (changed)="onRaffleChanged($event)"
                          (deleted)="onRaffleDeleted($event)"
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
export class DashboardHome implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly raffleService = inject(RaffleService);

  protected readonly loading    = signal(true);
  protected readonly raffles    = signal<RaffleListItem[]>([]);
  protected readonly showModal  = signal(false);
  protected readonly openMenuId = signal<string | null>(null);

  protected readonly firstName = computed(() => {
    const parts = this.auth.user()?.fullName?.split(' ') ?? [];
    return parts.length > 0 ? parts[0] : 'organizador';
  });
  protected readonly activeCount   = computed(() => this.raffles().filter(r => r.publicationStatus === 'PUBLISHED').length);
  protected readonly draftCount    = computed(() => this.raffles().filter(r => r.publicationStatus === 'DRAFT').length);
  protected readonly finishedCount = computed(() => this.raffles().filter(r => r.operationalStatus === 'FINISHED').length);
  protected readonly recentRaffles = computed(() => this.raffles().slice(0, 5));

  ngOnInit(): void { this.load(); }

  protected load(): void {
    this.raffleService.getMyRaffles().subscribe({
      next: r => { this.raffles.set(r); this.loading.set(false); },
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

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected pubBadgeCls(s: string): string {
    return {
      DRAFT:     'bg-secondary text-white',
      PUBLISHED: 'bg-success text-white',
      PAUSED:    'bg-warning text-dark',
      CLOSED:    'bg-dark text-white',
    }[s] ?? 'bg-secondary text-white';
  }

  protected pubLabel(s: string): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada' }[s] ?? s;
  }
}
