import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RaffleService } from '../../../core/services/raffle.service';

function minFutureDateTimeValidator(minMinutesAhead: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) return null;

    const target = new Date(rawValue);
    if (Number.isNaN(target.getTime())) return { invalidDateTime: true };

    return target.getTime() >= Date.now() + minMinutesAhead * 60_000
      ? null
      : { minFutureDateTime: { minMinutesAhead } };
  };
}

@Component({
  selector: 'app-raffle-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="d-flex align-items-center gap-3 mb-4">
      <a routerLink="/dashboard/rifas" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-arrow-left"></i>
      </a>
      <div>
        <h2 class="fw-bold mb-0">Nueva Rifa</h2>
        <p class="text-muted small mb-0">Completá los datos para crear tu rifa</p>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-danger py-2 small mb-3">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ error() }}
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="row g-4">

        <!-- Información básica -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-info-circle me-2 text-primary"></i>Información básica
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label fw-medium" for="title">Título de la rifa *</label>
                <input id="title" type="text" class="form-control" formControlName="title"
                       placeholder="Ej: Rifa del Toyota Corolla 2026"
                       [class.is-invalid]="t('title') && form.get('title')?.invalid">
                <div class="invalid-feedback">Requerido</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium" for="description">Descripción</label>
                <textarea id="description" class="form-control" rows="3"
                          formControlName="description"
                          placeholder="Describí los detalles de tu rifa..."></textarea>
              </div>
              <div class="row g-3">
                <div class="col-sm-6">
                  <label class="form-label fw-medium" for="totalNumbers">Total de números *</label>
                  <input id="totalNumbers" type="number" class="form-control" formControlName="totalNumbers"
                         min="2" [class.is-invalid]="t('totalNumbers') && form.get('totalNumbers')?.invalid">
                  <div class="invalid-feedback">Mínimo 2 números</div>
                </div>
                <div class="col-sm-6">
                  <label class="form-label fw-medium" for="pricePerNumber">Precio por número (ARS) *</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input id="pricePerNumber" type="number" class="form-control" formControlName="pricePerNumber"
                           min="1" [class.is-invalid]="t('pricePerNumber') && form.get('pricePerNumber')?.invalid">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Premio -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-trophy me-2 text-warning"></i>Premio
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label fw-medium" for="prizeName">Nombre del premio *</label>
                <input id="prizeName" type="text" class="form-control" formControlName="prizeName"
                       placeholder="Ej: Toyota Corolla 2026"
                       [class.is-invalid]="t('prizeName') && form.get('prizeName')?.invalid">
              </div>
              <div class="row g-3">
                <div class="col-sm-6">
                  <label class="form-label fw-medium" for="prizeEstimatedValue">Valor estimado (ARS)</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input id="prizeEstimatedValue" type="number" class="form-control"
                           formControlName="prizeEstimatedValue" min="0">
                  </div>
                </div>
              </div>
              <div class="mt-3">
                <label class="form-label fw-medium" for="prizeDescription">Descripción del premio</label>
                <textarea id="prizeDescription" class="form-control" rows="2"
                          formControlName="prizeDescription"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuración del sorteo -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white fw-semibold">
              <i class="bi bi-gear me-2 text-secondary"></i>Sorteo
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label fw-medium" for="drawDateTime">Fecha y hora del sorteo</label>
                <input id="drawDateTime" type="datetime-local" class="form-control"
                       formControlName="drawDateTime"
                       [attr.min]="minDrawDateTime()"
                       [class.is-invalid]="t('drawDateTime') && form.get('drawDateTime')?.invalid">
                <div class="invalid-feedback">{{ drawDateTimeError() }}</div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium" for="drawMethod">Método de sorteo</label>
                <select id="drawMethod" class="form-select" formControlName="drawMethod">
                  <option value="MANUAL">Manual (vos lo ejecutás)</option>
                  <option value="AUTOMATIC">Automático (al llegar la fecha)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium" for="drawPolicy">Política del sorteo</label>
                <select id="drawPolicy" class="form-select" formControlName="drawPolicy">
                  <option value="PAID_ONLY">Solo números pagados</option>
                  <option value="ALL_NUMBERS">Todos los reservados</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Resumen -->
          <div class="card border-0 shadow-sm bg-primary bg-opacity-10 border-primary">
            <div class="card-body">
              <h6 class="fw-bold text-primary mb-3">Resumen</h6>
              <div class="d-flex justify-content-between mb-1">
                <span class="small text-muted">Total números</span>
                <span class="fw-semibold">{{ form.get('totalNumbers')?.value ?? 0 }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="small text-muted">Precio por número</span>
                <span class="fw-semibold">$ {{ form.get('pricePerNumber')?.value ?? 0 }}</span>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between">
                <span class="small fw-medium">Recaudación potencial</span>
                <span class="fw-bold text-primary">$ {{ potentialRevenue() | number }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex gap-3 mt-2">
        <button type="submit" class="btn btn-primary px-4 fw-semibold" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          }
          <i class="bi bi-check-lg me-1"></i>Crear Rifa
        </button>
        <a routerLink="/dashboard/rifas" class="btn btn-outline-secondary">Cancelar</a>
      </div>
    </form>
  `
})
export class RaffleForm {
  private readonly raffleService = inject(RaffleService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    title:              ['', Validators.required],
    description:        [''],
    totalNumbers:       [100, [Validators.required, Validators.min(2)]],
    pricePerNumber:     [1000, [Validators.required, Validators.min(1)]],
    drawDateTime:       ['', minFutureDateTimeValidator(30)],
    drawMethod:         ['MANUAL'],
    drawPolicy:         ['PAID_ONLY'],
    prizeName:          ['', Validators.required],
    prizeDescription:   [''],
    prizeEstimatedValue:[null as number | null],
  });

  protected t(field: string): boolean {
    return !!this.form.get(field)?.touched;
  }

  protected drawDateTimeError(): string {
    const control = this.form.get('drawDateTime');
    if (!control?.touched || !control.errors) return '';
    if (control.hasError('invalidDateTime')) return 'Fecha invalida';
    if (control.hasError('minFutureDateTime')) return 'Debe ser al menos 30 minutos posterior a la hora actual';
    return 'Fecha invalida';
  }

  protected minDrawDateTime(): string {
    return this.toLocalDateTimeValue(new Date(Date.now() + 30 * 60_000));
  }

  protected potentialRevenue(): number {
    const total = this.form.get('totalNumbers')?.value ?? 0;
    const price = this.form.get('pricePerNumber')?.value ?? 0;
    return (total as number) * (price as number);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    this.raffleService.create({
      title:              raw.title!,
      description:        raw.description || undefined,
      totalNumbers:       raw.totalNumbers!,
      pricePerNumber:     raw.pricePerNumber!,
      drawDateTime:       raw.drawDateTime || undefined,
      drawMethod:         (raw.drawMethod as 'MANUAL' | 'AUTOMATIC'),
      drawPolicy:         (raw.drawPolicy as 'PAID_ONLY' | 'ALL_NUMBERS'),
      prizeName:          raw.prizeName || undefined,
      prizeDescription:   raw.prizeDescription || undefined,
      prizeEstimatedValue: raw.prizeEstimatedValue ?? undefined,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard/rifas']),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  private toLocalDateTimeValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
