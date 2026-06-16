import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RaffleService } from '../../../core/services/raffle.service';
import { RaffleListItem } from '../../../core/models/raffle.models';

interface MenuPos { top: string; bottom: string; right: string; origin: string; }

@Component({
  selector: 'app-raffle-actions-menu',
  imports: [],
  template: `
    <div class="action-dropdown">
      <button class="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
              (click)="onToggle($event)"
              aria-haspopup="true"
              [attr.aria-expanded]="isOpen()"
              aria-label="Mas acciones">
        <i class="bi bi-three-dots-vertical"></i>
      </button>

      @if (isOpen()) {
        <div class="action-menu" role="menu" [style]="menuStyle()">
          @if (raffle().operationalStatus !== 'FINISHED') {
            <button class="action-item" role="menuitem"
                    (click)="$event.stopPropagation(); publish()"
                    [class.action-item--disabled]="!canPublish()">
              <i [class]="publishIcon()" [style.color]="publishColor()"></i>
              <span>{{ raffle().publicationStatus === 'PAUSED' ? 'Reactivar' : 'Publicar' }}</span>
            </button>
            <button class="action-item" role="menuitem"
                    (click)="$event.stopPropagation(); pause()"
                    [class.action-item--disabled]="raffle().publicationStatus !== 'PUBLISHED'">
              <i class="bi bi-pause-circle" style="color:#f59e0b"></i>
              <span>Pausar</span>
            </button>
            <button class="action-item" role="menuitem"
                    (click)="$event.stopPropagation(); requestCancel()"
                    [class.action-item--disabled]="raffle().operationalStatus === 'FINISHED' || raffle().operationalStatus === 'CANCELLED'">
              <i class="bi bi-slash-circle" style="color:#dc2626"></i>
              <span>Cancelar rifa</span>
            </button>
            <div class="action-divider"></div>
            <button class="action-item" role="menuitem"
                    (click)="$event.stopPropagation(); requestDraw()"
                    [class.action-item--disabled]="raffle().operationalStatus === 'FINISHED' || raffle().operationalStatus === 'CANCELLED' || raffle().reservedCount <= 0">
              <i class="bi bi-stars" style="color:#ec4899"></i>
              <span>Ejecutar sorteo</span>
            </button>
            <div class="action-divider"></div>
          }
          <button class="action-item" role="menuitem"
                  (click)="$event.stopPropagation(); requestDelete()">
            <i class="bi bi-trash" style="color:#dc2626"></i>
            <span>Eliminar rifa</span>
          </button>
        </div>
      }
    </div>
  `
})
export class RaffleActionsMenu {
  readonly raffle   = input.required<RaffleListItem>();
  readonly isOpen   = input.required<boolean>();

  readonly toggled             = output<MouseEvent>();
  readonly changed             = output<RaffleListItem>();
  readonly cancelRequested     = output<void>();
  readonly deleteRequested     = output<void>();
  readonly drawConfirmRequested = output<void>();

  private readonly raffleService = inject(RaffleService);

  private static readonly MENU_H = 240;
  private readonly menuPos = signal<MenuPos>({ top: 'auto', bottom: 'auto', right: '0px', origin: 'bottom right' });

  protected readonly menuStyle = computed(() => {
    const { top, bottom, right, origin } = this.menuPos();
    return `position:fixed;top:${top};bottom:${bottom};right:${right};z-index:1055;transform-origin:${origin}`;
  });

  protected onToggle(e: MouseEvent): void {
    if (!this.isOpen()) {
      const btn = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const right = `${window.innerWidth - btn.right}px`;
      const openDown = (window.innerHeight - btn.bottom) >= RaffleActionsMenu.MENU_H;
      this.menuPos.set(openDown
        ? { top: `${btn.bottom + 6}px`, bottom: 'auto', right, origin: 'top right' }
        : { top: 'auto', bottom: `${window.innerHeight - btn.top + 6}px`, right, origin: 'bottom right' }
      );
    }
    this.toggled.emit(e);
  }

  protected publish(): void {
    if (!this.canPublish()) return;
    this.raffleService.publish(this.raffle().id).subscribe({
      next: updated => this.changed.emit(updated),
    });
  }

  protected pause(): void {
    if (this.raffle().publicationStatus !== 'PUBLISHED') return;
    this.raffleService.pause(this.raffle().id).subscribe({
      next: updated => this.changed.emit(updated),
    });
  }

  protected requestCancel(): void {
    const r = this.raffle();
    if (r.operationalStatus === 'FINISHED' || r.operationalStatus === 'CANCELLED') return;
    this.cancelRequested.emit();
  }

  protected requestDraw(): void {
    const r = this.raffle();
    if (r.operationalStatus === 'FINISHED' || r.operationalStatus === 'CANCELLED') return;
    if (r.reservedCount <= 0) return;
    this.drawConfirmRequested.emit();
  }

  protected requestDelete(): void {
    this.deleteRequested.emit();
  }

  protected canPublish(): boolean {
    const r = this.raffle();
    return (r.publicationStatus === 'DRAFT' || r.publicationStatus === 'PAUSED')
      && r.operationalStatus !== 'FINISHED'
      && r.operationalStatus !== 'CANCELLED';
  }

  protected publishIcon(): string {
    return this.raffle().publicationStatus === 'PAUSED' ? 'bi bi-play-circle-fill' : 'bi bi-send-fill';
  }

  protected publishColor(): string {
    return this.raffle().publicationStatus === 'PAUSED' ? '#10b981' : '#4f46e5';
  }
}
