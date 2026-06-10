import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListItem } from '../../../core/models/raffle.models';

@Component({
  selector: 'app-raffle-list',
  imports: [RouterLink, CurrencyArPipe],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-0">Mis Rifas</h2>
        <p class="text-muted small mb-0">Gestioná todas tus rifas desde aquí</p>
      </div>
      <a routerLink="/dashboard/rifas/nueva" class="btn btn-primary">
        <i class="bi bi-plus-lg me-1"></i>Nueva Rifa
      </a>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    }

    @if (!loading() && raffles().length === 0) {
      <div class="card border-0 shadow-sm text-center py-5">
        <div class="card-body">
          <i class="bi bi-ticket-perforated text-muted" style="font-size:4rem"></i>
          <h4 class="mt-3 fw-semibold">Todavía no tenés rifas</h4>
          <p class="text-muted">Creá tu primera rifa y empezá a vender números hoy</p>
          <a routerLink="/dashboard/rifas/nueva" class="btn btn-primary">
            <i class="bi bi-plus-lg me-1"></i>Crear mi primera rifa
          </a>
        </div>
      </div>
    }

    @if (!loading() && raffles().length > 0) {
      <div class="row g-3">
        @for (r of raffles(); track r.id) {
          <div class="col-md-6 col-xl-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span [class]="pubBadge(r.publicationStatus)">{{ pubLabel(r.publicationStatus) }}</span>
                  <span [class]="opBadge(r.operationalStatus)">{{ opLabel(r.operationalStatus) }}</span>
                </div>
                <h5 class="card-title fw-semibold mb-1">{{ r.title }}</h5>
                @if (r.drawDateTime) {
                  <p class="small text-muted mb-2">
                    <i class="bi bi-calendar3 me-1"></i>{{ formatDate(r.drawDateTime) }}
                  </p>
                }
                <div class="d-flex gap-3 small text-muted">
                  <span><i class="bi bi-hash me-1"></i>{{ r.totalNumbers }} números</span>
                  <span><i class="bi bi-currency-exchange me-1"></i>{{ r.pricePerNumber | currencyAr }}</span>
                </div>
              </div>
              <div class="card-footer bg-transparent border-top d-flex gap-2">
                <a [routerLink]="['/rifa', r.slug]" target="_blank"
                   class="btn btn-sm btn-outline-secondary flex-fill">
                  <i class="bi bi-eye me-1"></i>Ver
                </a>
                <button class="btn btn-sm btn-outline-primary flex-fill"
                        (click)="publish(r)" [disabled]="r.publicationStatus !== 'DRAFT'">
                  <i class="bi bi-send me-1"></i>Publicar
                </button>
                <button class="btn btn-sm btn-outline-success flex-fill"
                        (click)="draw(r)"
                        [disabled]="r.operationalStatus === 'FINISHED' || r.operationalStatus === 'CANCELLED'">
                  <i class="bi bi-stars me-1"></i>Sortear
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class RaffleList implements OnInit {
  private readonly raffleService = inject(RaffleService);

  protected readonly loading = signal(true);
  protected readonly raffles = signal<RaffleListItem[]>([]);

  ngOnInit(): void {
    this.raffleService.getMyRaffles().subscribe({
      next: r => { this.raffles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected publish(r: RaffleListItem): void {
    this.raffleService.publish(r.id).subscribe({
      next: updated => this.raffles.update(list =>
        list.map(x => x.id === updated.id ? updated : x)
      ),
    });
  }

  protected draw(r: RaffleListItem): void {
    if (!confirm(`¿Confirmar sorteo de "${r.title}"?`)) return;
    this.raffleService.executeDraw(r.id).subscribe();
  }

  protected formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  protected pubBadge(s: string): string {
    return { DRAFT: 'badge bg-secondary', PUBLISHED: 'badge bg-success', PAUSED: 'badge bg-warning text-dark', CLOSED: 'badge bg-dark' }[s] ?? 'badge bg-secondary';
  }
  protected pubLabel(s: string): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Publicada', PAUSED: 'Pausada', CLOSED: 'Cerrada' }[s] ?? s;
  }
  protected opBadge(s: string): string {
    return { ACTIVE: 'badge bg-primary', SOLD_OUT: 'badge bg-warning text-dark', FINISHED: 'badge bg-success', CANCELLED: 'badge bg-danger', EXECUTING: 'badge bg-info' }[s] ?? 'badge bg-secondary';
  }
  protected opLabel(s: string): string {
    return { ACTIVE: 'Activa', SOLD_OUT: 'Agotada', FINISHED: 'Finalizada', CANCELLED: 'Cancelada', EXECUTING: 'Sorteando', PENDING_DRAW: 'Pronto sorteo' }[s] ?? s;
  }
}
