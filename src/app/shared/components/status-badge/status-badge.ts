import { Component, computed, input } from '@angular/core';

type BadgeCategory = 'publication' | 'operational' | 'reservation';
type BadgeTone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'dark';
type BadgeVariant = 'soft' | 'solid';

type BadgeConfig = {
  label: string;
  tone: BadgeTone;
  variant?: BadgeVariant;
};

const PUBLICATION_STATUS: Record<string, BadgeConfig> = {
  DRAFT: { label: 'Borrador', tone: 'slate' },
  PUBLISHED: { label: 'Publicada', tone: 'indigo' },
  PAUSED: { label: 'Pausada', tone: 'amber' },
  CLOSED: { label: 'Cerrada', tone: 'dark' },
};

const OPERATIONAL_STATUS: Record<string, BadgeConfig> = {
  ACTIVE: { label: 'Activa', tone: 'indigo' },
  SOLD_OUT: { label: 'Agotada', tone: 'amber' },
  FINISHED: { label: 'Finalizada', tone: 'emerald' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
  EXECUTING: { label: 'Sorteando', tone: 'cyan' },
  PENDING_DRAW: { label: 'Pronto sorteo', tone: 'cyan' },
};

const RESERVATION_STATUS: Record<string, BadgeConfig> = {
  PENDING: { label: 'Pendiente', tone: 'amber' },
  CONFIRMED: { label: 'Confirmada', tone: 'emerald' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
  EXPIRED: { label: 'Expirada', tone: 'slate' },
};

function resolveStatus(category: BadgeCategory, value: string): BadgeConfig {
  const lookup = {
    publication: PUBLICATION_STATUS,
    operational: OPERATIONAL_STATUS,
    reservation: RESERVATION_STATUS,
  }[category];

  return lookup[value] ?? { label: value, tone: 'slate' };
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="app-status-badge"
          [class.app-status-badge--soft]="config().variant !== 'solid'"
          [class.app-status-badge--solid]="config().variant === 'solid'"
          [class.app-status-badge--slate]="config().tone === 'slate'"
          [class.app-status-badge--indigo]="config().tone === 'indigo'"
          [class.app-status-badge--emerald]="config().tone === 'emerald'"
          [class.app-status-badge--amber]="config().tone === 'amber'"
          [class.app-status-badge--red]="config().tone === 'red'"
          [class.app-status-badge--cyan]="config().tone === 'cyan'"
          [class.app-status-badge--dark]="config().tone === 'dark'">
      {{ label() || config().label }}
    </span>
  `,
  styles: [`
    .app-status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 1.7rem;
      padding: 0.32rem 0.78rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      line-height: 1;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .app-status-badge--soft.app-status-badge--slate { background: rgba(100,116,139,.14); color: #64748b; }
    .app-status-badge--soft.app-status-badge--indigo { background: rgba(99,102,241,.14); color: #4f46e5; }
    .app-status-badge--soft.app-status-badge--emerald { background: rgba(16,185,129,.14); color: #059669; }
    .app-status-badge--soft.app-status-badge--amber { background: rgba(245,158,11,.16); color: #b45309; }
    .app-status-badge--soft.app-status-badge--red { background: rgba(239,68,68,.14); color: #dc2626; }
    .app-status-badge--soft.app-status-badge--cyan { background: rgba(6,182,212,.14); color: #0891b2; }
    .app-status-badge--soft.app-status-badge--dark { background: rgba(15,23,42,.92); color: #e2e8f0; }

    .app-status-badge--solid.app-status-badge--slate { background: #64748b; color: #fff; }
    .app-status-badge--solid.app-status-badge--indigo { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
    .app-status-badge--solid.app-status-badge--emerald { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
    .app-status-badge--solid.app-status-badge--amber { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
    .app-status-badge--solid.app-status-badge--red { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
    .app-status-badge--solid.app-status-badge--cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; }
    .app-status-badge--solid.app-status-badge--dark { background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; }
  `]
})
export class StatusBadge {
  readonly category = input.required<BadgeCategory>();
  readonly value = input.required<string>();
  readonly label = input('');
  readonly variant = input<BadgeVariant>('soft');

  protected readonly config = computed(() => ({
    ...resolveStatus(this.category(), this.value()),
    variant: this.variant(),
  }));
}
