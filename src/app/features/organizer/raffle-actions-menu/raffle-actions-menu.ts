import { Component, inject, input, output, signal } from '@angular/core';
import { RaffleService } from '../../../core/services/raffle.service';
import { RaffleListItem } from '../../../core/models/raffle.models';

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
        <div class="action-menu" role="menu"
             [class.action-menu--down]="direction() === 'down'"
             [class.action-menu--fixed]="fixedMenu()"
             [style.top]="fixedMenu() ? fixedPos().top : null"
             [style.bottom]="fixedMenu() ? fixedPos().bottom : null"
             [style.right]="fixedMenu() ? fixedPos().right : null">
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
  readonly raffle    = input.required<RaffleListItem>();
  readonly isOpen    = input.required<boolean>();
  readonly direction = input<'up' | 'down'>('up');
  readonly fixedMenu = input(false);

  readonly toggled              = output<MouseEvent>();
  readonly changed              = output<RaffleListItem>();
  readonly cancelRequested      = output<void>();
  readonly deleteRequested      = output<void>();
  readonly drawConfirmRequested = output<void>();

  protected readonly fixedPos = signal<{ top: string; bottom: string; right: string }>(
    { top: 'auto', bottom: 'auto', right: '0px' }
  );

  private readonly raffleService = inject(RaffleService);

  protected onToggle(e: MouseEvent): void {
    if (this.fixedMenu() && !this.isOpen()) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const right = `${window.innerWidth - rect.right}px`;
      if (this.direction() === 'down') {
        this.fixedPos.set({ top: `${rect.bottom + 8}px`, bottom: 'auto', right });
      } else {
        this.fixedPos.set({ top: 'auto', bottom: `${window.innerHeight - rect.top + 8}px`, right });
      }
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
