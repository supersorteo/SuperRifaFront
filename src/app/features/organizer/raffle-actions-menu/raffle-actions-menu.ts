import { Component, inject, input, output } from '@angular/core';
import { RaffleService } from '../../../core/services/raffle.service';
import { RaffleListItem } from '../../../core/models/raffle.models';

@Component({
  selector: 'app-raffle-actions-menu',
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
        <div class="action-menu" role="menu">
          <button class="action-item" role="menuitem"
                  (click)="publish()"
                  [class.action-item--disabled]="raffle().publicationStatus !== 'DRAFT'">
            <i class="bi bi-send text-primary"></i>
            <span>Publicar</span>
          </button>
          <button class="action-item" role="menuitem"
                  (click)="pause()"
                  [class.action-item--disabled]="raffle().publicationStatus !== 'PUBLISHED'">
            <i class="bi bi-pause-circle" style="color:#f59e0b"></i>
            <span>Pausar</span>
          </button>
          <div class="action-divider"></div>
          <button class="action-item" role="menuitem"
                  (click)="draw()"
                  [class.action-item--disabled]="raffle().operationalStatus === 'FINISHED' || raffle().operationalStatus === 'CANCELLED' || raffle().reservedCount <= 0">
            <i class="bi bi-stars" style="color:#ec4899"></i>
            <span>Ejecutar sorteo</span>
          </button>
          <div class="action-divider"></div>
          <button class="action-item" role="menuitem"
                  (click)="remove()">
            <i class="bi bi-trash" style="color:#dc2626"></i>
            <span>Eliminar rifa</span>
          </button>
        </div>
      }
    </div>
  `
})
export class RaffleActionsMenu {
  readonly raffle = input.required<RaffleListItem>();
  readonly isOpen = input.required<boolean>();
  readonly toggled = output<MouseEvent>();
  readonly changed = output<RaffleListItem>();
  readonly deleted = output<string>();
  readonly drawRequested = output<RaffleListItem>();
  readonly drawFailed = output<string>();
  readonly drawExecuted = output<void>();

  private readonly raffleService = inject(RaffleService);

  protected onToggle(e: MouseEvent): void {
    this.toggled.emit(e);
  }

  protected publish(): void {
    if (this.raffle().publicationStatus !== 'DRAFT') return;
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

  protected draw(): void {
    const raffle = this.raffle();
    if (raffle.operationalStatus === 'FINISHED' || raffle.operationalStatus === 'CANCELLED') return;
    if (raffle.reservedCount <= 0) {
      this.drawFailed.emit('La rifa debe tener al menos un numero reservado antes de ejecutar el sorteo');
      return;
    }
    if (!confirm(`Confirmar sorteo de "${raffle.title}"?\n\nEsta accion no se puede deshacer.`)) return;

    this.drawRequested.emit(raffle);
    this.raffleService.executeDraw(raffle.id).subscribe({
      next: () => this.drawExecuted.emit(),
      error: (error: Error) => this.drawFailed.emit(error.message),
    });
  }

  protected remove(): void {
    const raffle = this.raffle();
    if (!confirm(`Eliminar la rifa "${raffle.title}"?\n\nSe eliminaran todos sus numeros, reservas y la pagina publica. Esta accion no se puede deshacer.`)) return;

    this.raffleService.delete(raffle.id).subscribe({
      next: () => this.deleted.emit(raffle.id),
    });
  }
}
