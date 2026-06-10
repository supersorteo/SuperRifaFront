import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { RaffleListImage, RaffleListItem } from '../../../core/models/raffle.models';
import { RaffleFormModal } from '../raffle-form-modal/raffle-form-modal';

@Component({
  selector: 'app-raffle-list',
  imports: [RouterLink, CurrencyArPipe, RaffleFormModal],
  host: { '(document:click)': 'closeAllMenus()' },
  template: `
    <app-raffle-form-modal
      [open]="showModal()"
      (closed)="showModal.set(false)"
      (created)="onRaffleCreated()" />

    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-0">Mis Rifas</h2>
        <p class="text-muted small mb-0">Gestioná todas tus rifas desde aquí</p>
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
        <h4 class="fw-bold mb-2">Todavía no tenés rifas</h4>
        <p class="text-muted mb-4">Creá tu primera rifa y empezá a vender números hoy mismo</p>
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
            <div class="card border-0 shadow-sm h-100 card-hover raffle-card-shell">
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
                      <span>Sin imágenes cargadas</span>
                    </div>
                  }
                </div>

                <div class="raffle-meta-strip">
                  <div class="raffle-meta-strip__item">
                    <span class="raffle-meta-strip__label">Números</span>
                    <span class="raffle-meta-strip__value">{{ r.totalNumbers }}</span>
                  </div>
                  <div class="raffle-meta-strip__item">
                    <span class="raffle-meta-strip__label">Participantes</span>
                    <span class="raffle-meta-strip__value">{{ r.participantCount }}</span>
                  </div>
                  <div class="raffle-meta-strip__item raffle-meta-strip__item--date">
                    <span class="raffle-meta-strip__label">Ejecución</span>
                    <span class="raffle-meta-strip__value">
                      {{ r.drawDateTime ? formatDate(r.drawDateTime) : 'Sin fecha' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="card-footer bg-transparent border-top d-flex align-items-center justify-content-between py-2 px-3">
                <span class="badge-pill" [class]="opBadgeCls(r.operationalStatus)">
                  {{ opLabel(r.operationalStatus) }}
                </span>

                <div class="d-flex align-items-center gap-1">
                  <a [routerLink]="['/rifa', r.slug]" target="_blank"
                     class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
                     title="Ver rifa pública" aria-label="Ver rifa">
                    <i class="bi bi-box-arrow-up-right"></i>
                  </a>

                  <div class="action-dropdown">
                    <button class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
                            (click)="toggleMenu($event, r.id)"
                            aria-haspopup="true"
                            [attr.aria-expanded]="openMenuId() === r.id"
                            aria-label="Más acciones">
                      <i class="bi bi-three-dots-vertical"></i>
                    </button>

                    @if (openMenuId() === r.id) {
                      <div class="action-menu" role="menu">
                        <button class="action-item" role="menuitem"
                                (click)="publish(r)"
                                [class.action-item--disabled]="r.publicationStatus !== 'DRAFT'">
                          <i class="bi bi-send text-primary"></i>
                          <span>Publicar</span>
                        </button>
                        <button class="action-item" role="menuitem"
                                (click)="pause(r)"
                                [class.action-item--disabled]="r.publicationStatus !== 'PUBLISHED'">
                          <i class="bi bi-pause-circle" style="color:#f59e0b"></i>
                          <span>Pausar</span>
                        </button>
                        <div class="action-divider"></div>
                        <button class="action-item" role="menuitem"
                                (click)="draw(r)"
                                [class.action-item--disabled]="r.operationalStatus === 'FINISHED' || r.operationalStatus === 'CANCELLED'">
                          <i class="bi bi-stars" style="color:#ec4899"></i>
                          <span>Ejecutar sorteo</span>
                        </button>
                        <div class="action-divider"></div>
                        <button class="action-item" role="menuitem"
                                (click)="remove(r)">
                          <i class="bi bi-trash" style="color:#dc2626"></i>
                          <span>Eliminar rifa</span>
                        </button>
                      </div>
                    }
                  </div>
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
  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly loading = signal(true);
  protected readonly raffles = signal<RaffleListItem[]>([]);
  protected readonly showModal = signal(false);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly activeImageIndex = signal<Record<string, number>>({});

  ngOnInit(): void {
    this.load();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  private load(): void {
    this.loading.set(true);
    this.raffleService.getMyRaffles().subscribe({
      next: r => { this.raffles.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected onRaffleCreated(): void { this.load(); }

  protected closeAllMenus(): void {
    this.openMenuId.set(null);
  }

  protected toggleMenu(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.openMenuId.update(curr => curr === id ? null : id);
  }

  protected publish(r: RaffleListItem): void {
    this.openMenuId.set(null);
    if (r.publicationStatus !== 'DRAFT') return;
    this.raffleService.publish(r.id).subscribe({
      next: updated => this.raffles.update(list => list.map(x => x.id === updated.id ? updated : x)),
    });
  }

  protected pause(r: RaffleListItem): void {
    this.openMenuId.set(null);
    if (r.publicationStatus !== 'PUBLISHED') return;
    this.raffleService.pause(r.id).subscribe({
      next: updated => this.raffles.update(list => list.map(x => x.id === updated.id ? updated : x)),
    });
  }

  protected draw(r: RaffleListItem): void {
    this.openMenuId.set(null);
    if (r.operationalStatus === 'FINISHED' || r.operationalStatus === 'CANCELLED') return;
    if (!confirm(`¿Confirmar sorteo de "${r.title}"?\n\nEsta acción no se puede deshacer.`)) return;
    this.raffleService.executeDraw(r.id).subscribe();
  }

  protected remove(r: RaffleListItem): void {
    this.openMenuId.set(null);
    if (!confirm(`¿Eliminar la rifa "${r.title}"?\n\nSe eliminará la rifa, sus números, reservas y la página pública asociada. Esta acción no se puede deshacer.`)) return;
    this.raffleService.delete(r.id).subscribe({
      next: () => this.raffles.update(list => list.filter(x => x.id !== r.id)),
    });
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
