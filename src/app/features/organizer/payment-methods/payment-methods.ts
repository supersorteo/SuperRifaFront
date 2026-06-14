import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizerService } from '../../../core/services/organizer.service';
import { PaymentMethod, PaymentMethodRequest, PaymentMethodType } from '../../../core/models/organizer.models';

@Component({
  selector: 'app-payment-methods',
  imports: [FormsModule],
  template: `
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
      <div>
        <h2 class="fw-black mb-1">Métodos de pago</h2>
        <p class="text-muted mb-0">Configurá cómo querés recibir los pagos de tus rifas</p>
      </div>
      <button class="btn btn-gradient fw-semibold px-4 rounded-3" (click)="openForm()">
        <i class="bi bi-plus-circle-fill me-1"></i>Agregar método
      </button>
    </div>

    <!-- Form -->
    @if (showForm()) {
      <div class="card border-0 shadow-sm mb-4 border-start border-primary border-4">
        <div class="card-body p-4">
          <h6 class="fw-bold mb-3">{{ editing() ? 'Editar método' : 'Nuevo método de pago' }}</h6>

          <form (ngSubmit)="submit()" #f="ngForm">
            <div class="row g-3">
              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold small">Tipo *</label>
                <select class="form-select" [(ngModel)]="form.type" name="type" required>
                  @for (t of typeOptions; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label fw-semibold small">Nombre visible *</label>
                <input class="form-control" [(ngModel)]="form.displayName" name="displayName"
                       maxlength="100" placeholder="Ej: Mercado Pago personal" required>
              </div>

              @if (form.type === 'ALIAS_CBU' || form.type === 'TRANSFER' || form.type === 'MERCADO_PAGO') {
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">Alias</label>
                  <input class="form-control" [(ngModel)]="form.alias" name="alias" maxlength="50">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label fw-semibold small">CBU / CVU</label>
                  <input class="form-control" [(ngModel)]="form.cbu" name="cbu" maxlength="22">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Titular de la cuenta</label>
                  <input class="form-control" [(ngModel)]="form.accountHolder" name="holder" maxlength="150">
                </div>
              }

              <div class="col-12">
                <label class="form-label fw-semibold small">Instrucciones para el participante</label>
                <textarea class="form-control" [(ngModel)]="form.instructions" name="instructions"
                          rows="2" maxlength="500"
                          placeholder="Ej: Enviá el comprobante de pago por WhatsApp"></textarea>
              </div>

              <div class="col-12">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="form.publicVisible"
                         name="publicVisible" id="pubVisible">
                  <label class="form-check-label small" for="pubVisible">
                    Visible en la página pública de la rifa
                  </label>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="button" class="btn btn-outline-secondary rounded-3" (click)="closeForm()">
                Cancelar
              </button>
              <button type="submit" class="btn btn-gradient fw-semibold rounded-3"
                      [disabled]="saving() || !form.displayName || !form.type">
                @if (saving()) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                {{ editing() ? 'Guardar cambios' : 'Agregar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- List -->
    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
    } @else if (methods().length === 0 && !showForm()) {
      <div class="card border-0 shadow-sm">
        <div class="text-center py-5">
          <i class="bi bi-credit-card text-muted" style="font-size:3rem"></i>
          <p class="text-muted mt-3 mb-0">No tenés métodos de pago configurados</p>
        </div>
      </div>
    } @else {
      <div class="d-flex flex-column gap-3">
        @for (m of methods(); track m.id) {
          <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-start gap-3">
              <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                   style="width:44px;height:44px;background:#e0e7ff">
                <i [class]="typeIcon(m.type)" style="color:#4f46e5;font-size:1.2rem"></i>
              </div>
              <div class="flex-grow-1 min-width-0">
                <div class="fw-bold">{{ m.displayName }}</div>
                <div class="small text-muted">{{ typeLabel(m.type) }}</div>
                @if (m.alias) {
                  <div class="small text-muted"><i class="bi bi-tag me-1"></i>{{ m.alias }}</div>
                }
                @if (m.cbu) {
                  <div class="small text-muted"><i class="bi bi-bank me-1"></i>{{ m.cbu }}</div>
                }
                @if (m.accountHolder) {
                  <div class="small text-muted"><i class="bi bi-person me-1"></i>{{ m.accountHolder }}</div>
                }
                @if (m.instructions) {
                  <div class="small text-muted mt-1 fst-italic">{{ m.instructions }}</div>
                }
              </div>
              <div class="d-flex gap-1 flex-shrink-0">
                @if (!m.publicVisible) {
                  <span class="badge bg-secondary rounded-pill align-self-start" style="font-size:.68rem">Privado</span>
                }
                <button class="btn btn-sm btn-outline-secondary rounded-3 px-2"
                        (click)="startEdit(m)" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-3 px-2"
                        [disabled]="deletingId() === m.id"
                        (click)="delete(m)" title="Eliminar">
                  @if (deletingId() === m.id) {
                    <span class="spinner-border spinner-border-sm"></span>
                  } @else {
                    <i class="bi bi-trash"></i>
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class PaymentMethods implements OnInit {
  private readonly orgService = inject(OrganizerService);

  protected readonly loading    = signal(true);
  protected readonly methods    = signal<PaymentMethod[]>([]);
  protected readonly showForm   = signal(false);
  protected readonly saving     = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly editing    = signal<PaymentMethod | null>(null);

  protected form: PaymentMethodRequest = this.emptyForm();

  protected readonly typeOptions: { value: PaymentMethodType; label: string }[] = [
    { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
    { value: 'ALIAS_CBU',   label: 'Alias / CBU' },
    { value: 'TRANSFER',    label: 'Transferencia bancaria' },
    { value: 'CASH',        label: 'Efectivo' },
    { value: 'WALLET',      label: 'Billetera virtual' },
    { value: 'OTHER',       label: 'Otro' },
  ];

  ngOnInit(): void {
    this.orgService.getPaymentMethods().subscribe({
      next: m => { this.methods.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected openForm(): void {
    this.editing.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  protected startEdit(m: PaymentMethod): void {
    this.editing.set(m);
    this.form = {
      type: m.type,
      displayName: m.displayName,
      alias: m.alias ?? '',
      cbu: m.cbu ?? '',
      cvu: m.cvu ?? '',
      accountHolder: m.accountHolder ?? '',
      instructions: m.instructions ?? '',
      publicVisible: m.publicVisible,
      displayOrder: m.displayOrder,
    };
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  protected submit(): void {
    this.saving.set(true);
    const editTarget = this.editing();
    const req$ = editTarget
      ? this.orgService.updatePaymentMethod(editTarget.id, this.form)
      : this.orgService.createPaymentMethod(this.form);

    req$.subscribe({
      next: result => {
        if (editTarget) {
          this.methods.update(list => list.map(x => x.id === result.id ? result : x));
        } else {
          this.methods.update(list => [...list, result]);
        }
        this.saving.set(false);
        this.closeForm();
      },
      error: () => this.saving.set(false),
    });
  }

  protected delete(m: PaymentMethod): void {
    this.deletingId.set(m.id);
    this.orgService.deletePaymentMethod(m.id).subscribe({
      next: () => {
        this.methods.update(list => list.filter(x => x.id !== m.id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  protected typeLabel(t: PaymentMethodType): string {
    return this.typeOptions.find(o => o.value === t)?.label ?? t;
  }

  protected typeIcon(t: PaymentMethodType): string {
    return ({
      MERCADO_PAGO: 'bi bi-phone',
      ALIAS_CBU:    'bi bi-bank',
      TRANSFER:     'bi bi-arrow-left-right',
      CASH:         'bi bi-cash',
      WALLET:       'bi bi-wallet2',
      OTHER:        'bi bi-three-dots',
    })[t] ?? 'bi bi-credit-card';
  }

  private emptyForm(): PaymentMethodRequest {
    return { type: 'MERCADO_PAGO', displayName: '', publicVisible: true };
  }
}
