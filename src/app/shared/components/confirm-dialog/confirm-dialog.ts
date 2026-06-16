import { Component, input, output, signal } from '@angular/core';

export interface ConfirmDialogItem {
  icon?: string;
  color?: string;
  text: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="app-confirm-overlay" role="dialog" aria-modal="true" (click)="cancel()">
        <div class="app-confirm-box" (click)="$event.stopPropagation()">
          <div class="app-confirm-icon"
               [class.app-confirm-icon--warn]="tone() === 'warning'"
               [class.app-confirm-icon--danger]="tone() === 'danger'"
               [class.app-confirm-icon--info]="tone() === 'info'">
            <i [class]="icon()"></i>
          </div>

          <h4 class="app-confirm-title">{{ title() }}</h4>
          <p class="app-confirm-body">{{ body() }}</p>

          @if (items().length > 0) {
            <ul class="app-confirm-list">
              @for (item of items(); track item.text) {
                <li>
                  @if (item.icon) {
                    <i [class]="item.icon + ' me-2'" [style.color]="item.color || null"></i>
                  }
                  {{ item.text }}
                </li>
              }
            </ul>
          }

          @if (confirmPhrase()) {
            <div class="app-confirm-check">
              <label class="app-confirm-check__label">
                Escribí <strong>{{ confirmPhrase() }}</strong> para confirmar
              </label>
              <input class="app-confirm-check__input"
                     type="text"
                     [value]="confirmText()"
                     (input)="confirmText.set($any($event.target).value)"
                     [placeholder]="confirmPhrase()">
            </div>
          }

          <div class="app-confirm-actions">
            <button type="button" class="app-confirm-cancel" (click)="cancel()">
              {{ cancelLabel() }}
            </button>
            <button type="button"
                    class="app-confirm-submit"
                    [class.app-confirm-submit--warn]="tone() === 'warning'"
                    [class.app-confirm-submit--danger]="tone() === 'danger'"
                    [class.app-confirm-submit--info]="tone() === 'info'"
                    [disabled]="busy() || !isPhraseValid()"
                    (click)="confirmAction()">
              @if (busy()) {
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
              }
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .app-confirm-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .app-confirm-box {
      width: 100%;
      max-width: 440px;
      padding: 2rem;
      border-radius: 1.25rem;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 25px 60px rgba(0,0,0,.6);
    }

    .app-confirm-icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 1.1rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .app-confirm-icon--warn { background: rgba(251,191,36,.15); color: #fbbf24; }
    .app-confirm-icon--danger { background: rgba(220,38,38,.15); color: #f87171; }
    .app-confirm-icon--info { background: rgba(99,102,241,.15); color: #818cf8; }

    .app-confirm-title {
      margin: 0 0 .6rem;
      color: #f1f5f9;
      text-align: center;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .app-confirm-body {
      margin: 0 0 1rem;
      color: #94a3b8;
      text-align: center;
      font-size: .88rem;
      line-height: 1.55;
    }

    .app-confirm-list {
      list-style: none;
      margin: 0 0 1.25rem;
      padding: .75rem 1rem;
      border-radius: .6rem;
      background: rgba(255,255,255,.04);
    }

    .app-confirm-list li {
      padding: .25rem 0;
      color: #94a3b8;
      font-size: .85rem;
    }

    .app-confirm-check {
      margin-bottom: 1.25rem;
    }

    .app-confirm-check__label {
      display: block;
      margin-bottom: .4rem;
      color: #64748b;
      font-size: .8rem;
    }

    .app-confirm-check__input {
      width: 100%;
      padding: .65rem .9rem;
      border-radius: .55rem;
      border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.05);
      color: #f1f5f9;
      outline: none;
      transition: border-color .2s;
    }

    .app-confirm-check__input:focus {
      border-color: #6366f1;
    }

    .app-confirm-actions {
      display: flex;
      gap: .75rem;
    }

    .app-confirm-cancel {
      flex: 1;
      padding: .7rem;
      border-radius: .65rem;
      border: 1px solid rgba(255,255,255,.1);
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: color .15s, border-color .15s;
    }

    .app-confirm-cancel:hover {
      color: #94a3b8;
      border-color: rgba(255,255,255,.2);
    }

    .app-confirm-submit {
      flex: 1;
      border: none;
      border-radius: .65rem;
      padding: .7rem;
      font-size: .9rem;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: opacity .2s;
    }

    .app-confirm-submit--warn { background: linear-gradient(135deg,#f59e0b,#d97706); }
    .app-confirm-submit--danger { background: linear-gradient(135deg,#dc2626,#b91c1c); }
    .app-confirm-submit--info { background: linear-gradient(135deg,#4f46e5,#7c3aed); }

    .app-confirm-submit:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .app-confirm-submit:not(:disabled):hover {
      opacity: .88;
    }
  `]
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly icon = input('bi bi-question-circle-fill');
  readonly tone = input<'warning' | 'danger' | 'info'>('danger');
  readonly items = input<ConfirmDialogItem[]>([]);
  readonly confirmPhrase = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly confirmText = signal('');

  protected isPhraseValid(): boolean {
    return !this.confirmPhrase() || this.confirmText() === this.confirmPhrase();
  }

  protected cancel(): void {
    this.confirmText.set('');
    this.cancelled.emit();
  }

  protected confirmAction(): void {
    if (!this.isPhraseValid() || this.busy()) return;
    this.confirmed.emit();
  }
}
