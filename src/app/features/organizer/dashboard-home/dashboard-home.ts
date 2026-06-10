import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListItem } from '../../../core/models/raffle.models';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, CurrencyArPipe],
  template: `
    <div class="mb-4">
      <h2 class="fw-bold mb-0">Hola, {{ firstName() }} 👋</h2>
      <p class="text-muted">Resumen de tu actividad en SuperRifa</p>
    </div>

    <!-- Stats cards -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="rounded-3 bg-primary bg-opacity-10 p-3">
              <i class="bi bi-ticket text-primary fs-4"></i>
            </div>
            <div>
              <div class="small text-muted">Total Rifas</div>
              <div class="fs-4 fw-bold">{{ raffles().length }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="rounded-3 bg-success bg-opacity-10 p-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="small text-muted">Activas</div>
              <div class="fs-4 fw-bold">{{ activeCount() }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="rounded-3 bg-warning bg-opacity-10 p-3">
              <i class="bi bi-hourglass-split text-warning fs-4"></i>
            </div>
            <div>
              <div class="small text-muted">Borradores</div>
              <div class="fs-4 fw-bold">{{ draftCount() }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="rounded-3 bg-info bg-opacity-10 p-3">
              <i class="bi bi-trophy text-info fs-4"></i>
            </div>
            <div>
              <div class="small text-muted">Finalizadas</div>
              <div class="fs-4 fw-bold">{{ finishedCount() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent raffles -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0 fw-semibold">Rifas recientes</h6>
        <a routerLink="/dashboard/rifas" class="btn btn-sm btn-outline-primary">Ver todas</a>
      </div>
      <div class="card-body p-0">
        @if (loading()) {
          <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        } @else if (recentRaffles().length === 0) {
          <div class="text-center py-4 text-muted">
            <p class="mb-2">Todavía no tenés rifas</p>
            <a routerLink="/dashboard/rifas/nueva" class="btn btn-primary btn-sm">
              <i class="bi bi-plus-lg me-1"></i>Crear mi primera rifa
            </a>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Rifa</th>
                  <th>Estado</th>
                  <th>Números</th>
                  <th>Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (r of recentRaffles(); track r.id) {
                  <tr>
                    <td class="fw-medium">{{ r.title }}</td>
                    <td>
                      <span class="badge rounded-pill"
                            [class]="pubBadge(r.publicationStatus)">
                        {{ pubLabel(r.publicationStatus) }}
                      </span>
                    </td>
                    <td>{{ r.totalNumbers }}</td>
                    <td>{{ r.pricePerNumber | currencyAr }}</td>
                    <td>
                      <a [routerLink]="['/rifa', r.slug]" target="_blank"
                         class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-eye"></i>
                      </a>
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

  protected readonly loading = signal(true);
  protected readonly raffles = signal<RaffleListItem[]>([]);

  protected readonly firstName     = computed(() => this.auth.user()?.fullName?.split(' ').at(0) ?? '');
  protected readonly activeCount   = computed(() => this.raffles().filter(r => r.publicationStatus === 'PUBLISHED').length);
  protected readonly draftCount    = computed(() => this.raffles().filter(r => r.publicationStatus === 'DRAFT').length);
  protected readonly finishedCount = computed(() => this.raffles().filter(r => r.operationalStatus === 'FINISHED').length);
  protected readonly recentRaffles = computed(() => this.raffles().slice(0, 5));

  ngOnInit(): void {
    this.raffleService.getMyRaffles().subscribe({
      next: r => { this.raffles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected pubBadge(s: string): string {
    return { DRAFT: 'bg-secondary', PUBLISHED: 'bg-success', PAUSED: 'bg-warning text-dark', CLOSED: 'bg-dark' }[s] ?? 'bg-secondary';
  }
  protected pubLabel(s: string): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Activa', PAUSED: 'Pausada', CLOSED: 'Cerrada' }[s] ?? s;
  }
}
